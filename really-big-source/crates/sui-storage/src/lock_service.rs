// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

//! lock_service is a single-threaded atomic Sui Object locking service.
//! Object locks have three phases:
//! 1. (object has no lock, doesn't exist)
//! 2. None (object has an empty lock, but exists. The state when a new object is created)
//! 3. Locked (object has a Transaction digest in the lock, so it's only usable by that transaction)
//!
//! The cycle goes from None (object creation) -> Locked -> deleted/doesn't exist after a Transaction.
//!
//! Lock state is persisted in RocksDB and should be consistent.
//!
//! Communication with the lock service happens through two MPSC queue/channels.
//! One channel is for atomic writes/mutates (init, acquire, remove), the other is for reads.
//! This allows reads to proceed without being blocked on writes.

use futures::channel::oneshot;
use rocksdb::Options;
use std::path::Path;
use std::sync::Arc;
use std::thread::JoinHandle;
use tokio::sync::mpsc::{channel, Receiver, Sender};
use tracing::{debug, info, trace, warn};
use typed_store::rocks::DBMap;
use typed_store::{reopen, traits::Map};

use sui_types::base_types::{ObjectRef, TransactionDigest};
use sui_types::error::{SuiError, SuiResult};

use crate::default_db_options;

/// Commands to send to the LockService (for mutating lock state)
// TODO: use smallvec as an optimization
#[derive(Debug)]
enum LockServiceCommands {
    Acquire {
        refs: Vec<ObjectRef>,
        tx_digest: TransactionDigest,
        resp: oneshot::Sender<SuiResult>,
    },
    Initialize {
        refs: Vec<ObjectRef>,
        is_force_reset: bool,
        resp: oneshot::Sender<SuiResult>,
    },
    RemoveLocks {
        refs: Vec<ObjectRef>,
        resp: oneshot::Sender<SuiResult>,
    },
}

type SuiLockResult = Result<Option<Option<TransactionDigest>>, SuiError>;

/// Queries to the LockService state
#[derive(Debug)]
enum LockServiceQueries {
    GetLock {
        object: ObjectRef,
        resp: oneshot::Sender<SuiLockResult>,
    },
    CheckLocksExist {
        objects: Vec<ObjectRef>,
        resp: oneshot::Sender<SuiResult>,
    },
}

/// Inner LockService implementation that does single threaded database accesses.  Cannot be
/// used publicly, must be wrapped in a LockService to control access.
#[derive(Clone)]
struct LockServiceImpl {
    /// This is a map between object references of currently active objects that can be mutated,
    /// and the transaction that they are lock on for use by this specific authority. Where an object
    /// lock exists for an object version, but no transaction has been seen using it the lock is set
    /// to None. The safety of consistent broadcast depend on each honest authority never changing
    /// the lock once it is set. After a certificate for this object is processed it can be
    /// forgotten.
    transaction_lock: DBMap<ObjectRef, Option<TransactionDigest>>,
}

// TODO: Create method needs to make sure only one instance or thread of this is running per authority
// If not for multiple authorities per process, it should really be one per process.
impl LockServiceImpl {
    /// Open or create a new LockService database
    fn try_open_db<P: AsRef<Path>>(path: P, db_options: Option<Options>) -> Result<Self, SuiError> {
        let (options, point_lookup) = default_db_options(db_options);

        let db = {
            let path = &path;
            let db_options = Some(options);
            let opt_cfs: &[(&str, &rocksdb::Options)] = &[("transaction_lock", &point_lookup)];
            typed_store::rocks::open_cf_opts(path, db_options, opt_cfs)
        }
        .map_err(SuiError::StorageError)?;

        let transaction_lock =
            reopen!(&db, "transaction_lock";<ObjectRef, Option<TransactionDigest>>);

        Ok(Self { transaction_lock })
    }

    /// Returns the state of a single lock.
    /// * None - lock does not exist and is not initialized
    /// * Some(None) - lock exists and is initialized, but not locked to a particular transaction
    /// * Some(Some(tx_digest)) - lock exists and set to transaction
    fn get_lock(&self, object: ObjectRef) -> Result<Option<Option<TransactionDigest>>, SuiError> {
        self.transaction_lock
            .get(&object)
            .map_err(SuiError::StorageError)
    }

    /// Checks multiple object locks exist.
    /// Returns Err(TransactionLockDoesNotExist) if at least one object lock is not initialized.
    fn locks_exist(&self, objects: &[ObjectRef]) -> SuiResult {
        let locks = self.transaction_lock.multi_get(objects)?;
        locks
            .iter()
            .all(Option::is_some)
            .then(|| {
                debug!(?objects, "locks_exist: all locks do exist");
            })
            .ok_or_else(|| {
                debug!(?locks, ?objects, "locks_exist: not all locks exist");
                SuiError::TransactionLockDoesNotExist
            })
    }

    /// Acquires a lock for a transaction on the given objects if they have all been initialized previously
    /// to None state.  It is also OK if they have been set to the same transaction.
    /// The locks are all set to the given transacton digest.
    /// Otherwise, SuiError(TransactionLockDoesNotExist, ConflictingTransaction) is returned.
    fn acquire_locks(
        &self,
        owned_input_objects: &[ObjectRef],
        tx_digest: TransactionDigest,
    ) -> SuiResult {
        debug!(?tx_digest, ?owned_input_objects, "acquire_locks");
        let mut locks_to_write = Vec::new();
        let locks = self.transaction_lock.multi_get(owned_input_objects)?;

        for (i, lock) in locks.iter().enumerate() {
            // The object / version must exist, and therefore lock initialized.
            let lock = lock.ok_or(SuiError::TransactionLockDoesNotExist)?;

            if let Some(previous_tx_digest) = lock {
                // Lock already set to different transaction
                if previous_tx_digest != tx_digest {
                    // TODO: add metrics here
                    debug!(prev_tx_digest =? previous_tx_digest,
                          cur_tx_digest =? tx_digest,
                          "Conflicting transaction!  Lock state changed in unexpected way");
                    return Err(SuiError::ConflictingTransaction {
                        pending_transaction: previous_tx_digest,
                    });
                }
            } else {
                // Only write the locks that need to be written (are uninitialized)
                let obj_ref = owned_input_objects[i];
                locks_to_write.push((obj_ref, Some(tx_digest)));
            }
        }

        if !locks_to_write.is_empty() {
            trace!(?locks_to_write, "Writing locks");
            self.transaction_lock
                .batch()
                .insert_batch(&self.transaction_lock, locks_to_write)?
                .write()?;
        }

        Ok(())
    }

    /// Initialize a lock to None (but exists) for a given list of ObjectRefs.
    /// If the lock already exists and is locked to a transaction, then return TransactionLockExists
    fn initialize_locks(&self, objects: &[ObjectRef], is_force_reset: bool) -> SuiResult {
        debug!(?objects, "initialize_locks");
        // Use a multiget for efficiency
        let locks = self.transaction_lock.multi_get(objects)?;

        if !is_force_reset {
            // If any locks exist and are not None, return errors for them
            let existing_locks: Vec<ObjectRef> = locks
                .iter()
                .zip(objects)
                .filter_map(|(lock_opt, objref)| lock_opt.flatten().map(|_tx_digest| *objref))
                .collect();
            if !existing_locks.is_empty() {
                info!(
                    ?existing_locks,
                    "Cannot initialize locks because some exist already"
                );
                return Err(SuiError::TransactionLockExists {
                    refs: existing_locks,
                });
            }
        }

        self.transaction_lock
            .multi_insert(objects.iter().map(|obj_ref| (obj_ref, None)))?;

        Ok(())
    }

    /// Removes locks for a given list of ObjectRefs.
    fn delete_locks(&self, objects: &[ObjectRef]) -> SuiResult {
        debug!(?objects, "delete_locks");
        self.transaction_lock.multi_remove(objects)?;
        Ok(())
    }

    /// Loop to continuously process mutating commands in a single thread from async senders.
    /// It terminates when the sender drops, which usually is when the containing data store is dropped.
    fn run_command_loop(&self, mut receiver: Receiver<LockServiceCommands>) {
        info!("LockService command processing loop started");
        // NOTE: we use blocking_recv() as its faster than using regular async recv() with awaits in a loop
        while let Some(msg) = receiver.blocking_recv() {
            match msg {
                LockServiceCommands::Acquire {
                    refs,
                    tx_digest,
                    resp,
                } => {
                    let res = self.acquire_locks(&refs, tx_digest);
                    if let Err(_e) = resp.send(res) {
                        warn!("Could not respond to sender, sender dropped!");
                    }
                }
                LockServiceCommands::Initialize {
                    refs,
                    is_force_reset,
                    resp,
                } => {
                    if let Err(_e) = resp.send(self.initialize_locks(&refs, is_force_reset)) {
                        warn!("Could not respond to sender, sender dropped!");
                    }
                }
                LockServiceCommands::RemoveLocks { refs, resp } => {
                    if let Err(_e) = resp.send(self.delete_locks(&refs)) {
                        warn!("Could not respond to sender, sender dropped!");
                    }
                }
            }
        }
        info!("LockService command loop stopped, the sender on other end hung up/dropped");
    }

    /// Loop to continuously process queries in a single thread
    fn run_queries_loop(&self, mut receiver: Receiver<LockServiceQueries>) {
        info!("LockService queries processing loop started");
        while let Some(msg) = receiver.blocking_recv() {
            match msg {
                LockServiceQueries::GetLock { object, resp } => {
                    if let Err(_e) = resp.send(self.get_lock(object)) {
                        warn!("Could not respond to sender!");
                    }
                }
                LockServiceQueries::CheckLocksExist { objects, resp } => {
                    if let Err(_e) = resp.send(self.locks_exist(&objects)) {
                        warn!("Could not respond to sender, sender dropped!");
                    }
                }
            }
        }
        info!("LockService queries loop stopped, the sender on other end hung up/dropped");
    }
}

const LOCKSERVICE_QUEUE_LEN: usize = 500;

/// Atomic Sui Object locking service.
/// Primary abstraction is an atomic op to acquire a lock on a given set of objects.
/// Atomicity relies on single threaded loop and only one instance per authority.
#[derive(Clone)]
pub struct LockService {
    inner: Arc<LockServiceInner>,
}

struct LockServiceInner {
    sender: Option<Sender<LockServiceCommands>>,
    query_sender: Option<Sender<LockServiceQueries>>,
    run_command_loop: Option<JoinHandle<()>>,
    run_queries_loop: Option<JoinHandle<()>>,
}

impl LockServiceInner {
    #[inline]
    fn sender(&self) -> &Sender<LockServiceCommands> {
        self.sender
            .as_ref()
            .expect("LockServiceInner should not have been dropped yet")
    }

    #[inline]
    fn query_sender(&self) -> &Sender<LockServiceQueries> {
        self.query_sender
            .as_ref()
            .expect("LockServiceInner should not have been dropped yet")
    }
}

impl Drop for LockServiceInner {
    fn drop(&mut self) {
        debug!("Begin Dropping LockService");

        // Take the two Senders and immediately drop them. This will prompt the two threads
        // "run_command_loop" and "run_queries_loop" to terminate so that we can join the threads.
        self.sender.take();
        self.query_sender.take();
        self.run_command_loop
            .take()
            .expect("run_command_loop thread should not have already been joined")
            .join()
            .unwrap();
        self.run_queries_loop
            .take()
            .expect("run_queries_loop thread should not have already been joined")
            .join()
            .unwrap();

        debug!("End Dropping LockService");
    }
}

impl LockService {
    /// Create a new instance of LockService.  For now, the caller has to guarantee only one per data store -
    /// namely each SuiDataStore creates its own LockService.
    pub fn new<P: AsRef<Path>>(path: P, db_options: Option<Options>) -> Result<Self, SuiError> {
        let inner_service = LockServiceImpl::try_open_db(path, db_options)?;

        // Now, create a sync channel and spawn a thread
        let (sender, receiver) = channel(LOCKSERVICE_QUEUE_LEN);
        let inner2 = inner_service.clone();
        let run_command_loop = std::thread::spawn(move || {
            inner2.run_command_loop(receiver);
        });

        let (q_sender, q_receiver) = channel(LOCKSERVICE_QUEUE_LEN);
        let run_queries_loop = std::thread::spawn(move || {
            inner_service.run_queries_loop(q_receiver);
        });

        Ok(Self {
            inner: Arc::new(LockServiceInner {
                sender: Some(sender),
                query_sender: Some(q_sender),
                run_command_loop: Some(run_command_loop),
                run_queries_loop: Some(run_queries_loop),
            }),
        })
    }

    /// Acquires a lock for a transaction on the given objects if they have all been initialized previously
    /// to None state.  It is also OK if they have been set to the same transaction.
    /// The locks are all set to the given transacton digest.
    /// Otherwise, SuiError(TransactionLockDoesNotExist, ConflictingTransaction) is returned.
    /// Note that this method sends a message to inner LockService implementation and waits for a response
    pub async fn acquire_locks(
        &self,
        refs: Vec<ObjectRef>,
        tx_digest: TransactionDigest,
    ) -> SuiResult {
        let (os_sender, os_receiver) = oneshot::channel::<SuiResult>();
        // NOTE: below is blocking, switch to Tokio channels which are async?
        self.inner
            .sender()
            .send(LockServiceCommands::Acquire {
                refs,
                tx_digest,
                resp: os_sender,
            })
            .await
            .expect("Could not send message to inner LockService");
        os_receiver
            .await
            .expect("Response from lockservice was cancelled, should not happen!")
    }

    /// Initialize a lock to None (but exists) for a given list of ObjectRefs.
    /// If `is_force_reset` is true, we initialize them regardless of their existing state.
    /// Otherwise, if the lock already exists and is locked to a transaction, then return TransactionLockExists
    /// Only the gateway could set is_force_reset to true.
    pub async fn initialize_locks(&self, refs: &[ObjectRef], is_force_reset: bool) -> SuiResult {
        let (os_sender, os_receiver) = oneshot::channel::<SuiResult>();
        self.inner
            .sender()
            .send(LockServiceCommands::Initialize {
                refs: Vec::from(refs),
                is_force_reset,
                resp: os_sender,
            })
            .await
            .expect("Could not send message to inner LockService");
        os_receiver
            .await
            .expect("Response from lockservice was cancelled, should not happen!")
    }

    /// Removes locks for a given list of ObjectRefs.
    pub async fn remove_locks(&self, refs: Vec<ObjectRef>) -> SuiResult {
        let (os_sender, os_receiver) = oneshot::channel::<SuiResult>();
        self.inner
            .sender()
            .send(LockServiceCommands::RemoveLocks {
                refs,
                resp: os_sender,
            })
            .await
            .expect("Could not send message to inner LockService");
        os_receiver
            .await
            .expect("Response from lockservice was cancelled, should not happen!")
    }

    /// Returns the state of a single lock.
    /// * None - lock does not exist and is not initialized
    /// * Some(None) - lock exists and is initialized, but not locked to a particular transaction
    /// * Some(Some(tx_digest)) - lock exists and set to transaction
    pub async fn get_lock(&self, object: ObjectRef) -> SuiLockResult {
        let (os_sender, os_receiver) = oneshot::channel::<SuiLockResult>();
        self.inner
            .query_sender()
            .send(LockServiceQueries::GetLock {
                object,
                resp: os_sender,
            })
            .await
            .expect("Could not send message to inner LockService");
        os_receiver
            .await
            .expect("Response from lockservice was cancelled, should not happen!")
    }

    /// Checks multiple object locks exist.
    /// Returns Err(TransactionLockDoesNotExist) if at least one object lock is not initialized.
    pub async fn locks_exist(&self, objects: Vec<ObjectRef>) -> SuiResult {
        let (os_sender, os_receiver) = oneshot::channel::<SuiResult>();
        self.inner
            .query_sender()
            .send(LockServiceQueries::CheckLocksExist {
                objects,
                resp: os_sender,
            })
            .await
            .expect("Could not send message to inner LockService");
        os_receiver
            .await
            .expect("Response from lockservice was cancelled, should not happen!")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures::future::join_all;
    use sui_types::base_types::{ObjectDigest, ObjectID, ObjectRef, TransactionDigest};
    use sui_types::error::SuiError;

    use pretty_assertions::assert_eq;

    fn init_lockservice_db() -> LockServiceImpl {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("DB_{:?}", ObjectID::random()));
        std::fs::create_dir(&path).unwrap();

        LockServiceImpl::try_open_db(path, None).expect("Could not create LockDB")
    }

    fn init_lockservice() -> LockService {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("DB_{:?}", ObjectID::random()));
        std::fs::create_dir(&path).unwrap();

        LockService::new(path, None).expect("Could not create LockService")
    }

    #[test]
    // Test acquire_locks() and initialize_locks()
    fn test_lockdb_acquire_init_multiple() {
        let ls = init_lockservice_db();

        let ref1: ObjectRef = (ObjectID::random(), 1.into(), ObjectDigest::random());
        let ref2: ObjectRef = (ObjectID::random(), 1.into(), ObjectDigest::random());
        let ref3: ObjectRef = (ObjectID::random(), 1.into(), ObjectDigest::random());

        let tx1 = TransactionDigest::random();
        let tx2 = TransactionDigest::random();

        // Should not be able to acquire lock for uninitialized locks
        assert_eq!(
            ls.acquire_locks(&[ref1, ref2], tx1),
            Err(SuiError::TransactionLockDoesNotExist)
        );
        assert_eq!(ls.get_lock(ref1), Ok(None));

        // Initialize 2 locks
        ls.initialize_locks(&[ref1, ref2], false /* is_force_reset */)
            .unwrap();
        assert_eq!(ls.get_lock(ref2), Ok(Some(None)));
        assert_eq!(ls.locks_exist(&[ref1, ref2]), Ok(()));

        // Should not be able to acquire lock if not all objects initialized
        assert_eq!(
            ls.acquire_locks(&[ref1, ref2, ref3], tx1),
            Err(SuiError::TransactionLockDoesNotExist)
        );

        // Should be able to acquire lock if all objects initialized
        ls.acquire_locks(&[ref1, ref2], tx1).unwrap();
        assert_eq!(ls.get_lock(ref2), Ok(Some(Some(tx1))));

        // Should be able to check locks exist for ref1 and ref2, but not others
        assert_eq!(ls.locks_exist(&[ref1, ref2]), Ok(()));
        assert_eq!(
            ls.locks_exist(&[ref2, ref3]),
            Err(SuiError::TransactionLockDoesNotExist)
        );

        // Should get TransactionLockExists if try to initialize already locked object
        assert!(matches!(
            ls.initialize_locks(&[ref2, ref3], false /* is_force_reset */),
            Err(SuiError::TransactionLockExists { .. })
        ));

        // Should not be able to acquire lock for diff tx if already locked
        ls.initialize_locks(&[ref3], false /* is_force_reset */)
            .unwrap();
        assert!(matches!(
            ls.acquire_locks(&[ref2, ref3], tx2),
            Err(SuiError::ConflictingTransaction { .. })
        ));
    }

    #[test]
    fn test_lockdb_remove_multiple() {
        let ls = init_lockservice_db();

        let ref1: ObjectRef = (ObjectID::random(), 1.into(), ObjectDigest::random());
        let ref2: ObjectRef = (ObjectID::random(), 1.into(), ObjectDigest::random());

        let tx1 = TransactionDigest::random();

        // Initialize 2 locks
        ls.initialize_locks(&[ref1, ref2], false /* is_force_reset */)
            .unwrap();

        // Should be able to acquire lock if all objects initialized
        ls.acquire_locks(&[ref1, ref2], tx1).unwrap();
        assert_eq!(ls.get_lock(ref2), Ok(Some(Some(tx1))));

        // Cannot initialize them again since they are locked already
        assert!(matches!(
            ls.initialize_locks(&[ref1, ref2], false /* is_force_reset */),
            Err(SuiError::TransactionLockExists { .. })
        ));

        // Now remove the locks
        ls.delete_locks(&[ref1, ref2]).unwrap();
        assert_eq!(ls.get_lock(ref2), Ok(None));

        // Now initialization should succeed
        ls.initialize_locks(&[ref1, ref2], false /* is_force_reset */)
            .unwrap();
    }

    #[tokio::test]
    async fn test_lockservice_conc_acquire_init() {
        telemetry_subscribers::init_for_testing();
        let ls = init_lockservice();

        let ref1: ObjectRef = (ObjectID::random(), 1.into(), ObjectDigest::random());
        let ref2: ObjectRef = (ObjectID::random(), 1.into(), ObjectDigest::random());
        let txdigests: Vec<TransactionDigest> =
            (0..10).map(|_n| TransactionDigest::random()).collect();

        // Should be able to concurrently initialize locks for same objects, all should succeed
        let futures = (0..10).map(|_n| {
            let ls = ls.clone();
            tokio::spawn(async move {
                ls.initialize_locks(&[ref1, ref2], false /* is_force_reset */)
                    .await
            })
        });
        let results = join_all(futures).await;
        assert!(results.iter().all(|res| res.is_ok()));

        let lock_state = ls.get_lock(ref1).await;
        assert_eq!(lock_state, Ok(Some(None)));
        assert_eq!(ls.locks_exist(vec![ref1, ref2]).await, Ok(()));

        // only one party should be able to successfully acquire the lock.  Use diff tx for each one
        let futures = txdigests.iter().map(|tx| {
            let ls = ls.clone();
            let tx = *tx;
            tokio::spawn(async move { ls.acquire_locks(vec![ref1, ref2], tx).await })
        });
        let results = join_all(futures).await;
        let inner_res: Vec<_> = results.into_iter().map(|r| r.unwrap()).collect();
        let num_oks = inner_res.iter().filter(|r| r.is_ok()).count();
        assert_eq!(num_oks, 1);

        assert_eq!(ls.locks_exist(vec![ref1, ref2]).await, Ok(()));

        // All other results should be ConflictingTransaction
        assert!(inner_res
            .iter()
            .filter(|r| r.is_err())
            .all(|r| matches!(r, Err(SuiError::ConflictingTransaction { .. }))));
    }
}
