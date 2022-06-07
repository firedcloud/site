// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

//! WriteAheadLog is used by authority.rs / authority_store.rs for safe updates of the datastore.
//! It is currently implemented using a rocksdb table, but the interface is designed to be
//! compatible with a true log.

use async_trait::async_trait;

use serde::{de::DeserializeOwned, Serialize};

use std::path::Path;
use std::sync::Mutex;

use crate::{
    default_db_options,
    mutex_table::{LockGuard, MutexTable},
};
use sui_types::base_types::TransactionDigest;

use sui_types::error::{SuiError, SuiResult};

use typed_store::{rocks::DBMap, traits::Map};

use tracing::{debug, error};

/// TxGuard is a handle on an in-progress transaction.
///
/// TxGuard must implement Drop, which should mark the tx as unfinished
/// if the guard is dropped without commit_tx being called.
#[allow(drop_bounds)]
pub trait TxGuard<'a>: Drop {
    fn tx_id(&self) -> TransactionDigest;
    fn commit_tx(self) -> SuiResult;
}

// WriteAheadLog is parameterized on the value type (C) because:
// - it's a pain to make a ConfirmationTransaction in tests.
// - we might end up storing either a ConfirmationTransaction or a (sequence, ConfirmationTransaction)
//   tuple, or something else
#[async_trait]
pub trait WriteAheadLog<'a, C> {
    type Guard: TxGuard<'a>;

    /// Begin a confirmation transaction identified by its digest, with the associated cert.
    ///
    /// The possible return values mean:
    ///
    ///   Ok(None) => There was a concurrent instance of the same tx in progress, but it ended
    ///   witout being committed. The caller may not proceed processing that tx. A TxGuard for
    ///   that tx can be (eventually) obtained by calling pop_one_recoverable_tx().
    ///
    ///   Ok(Some(TxGuard)) => No other concurrent instance of the same tx is in progress, nor can
    ///   one start while the guard is held. However, a prior instance of the same tx could have
    ///   just finished, so the caller may want to check if the tx is already sequenced before
    ///   proceeding.
    ///
    ///   Err(e) => An error occurred.
    #[must_use]
    async fn begin_tx(&'a self, tx: &TransactionDigest, cert: &C)
        -> SuiResult<Option<Self::Guard>>;

    /// Recoverable TXes are TXes that we find in the log at start up (which indicates we crashed
    /// while processing them) or implicitly dropped TXes (which can happen because we errored
    /// out of the write path and implicitly dropped the TxGuard).
    ///
    /// This method pops one recoverable tx from that log, acquires the lock for that tx,
    /// and returns a TxGuard.
    ///
    /// The caller is responsible for running the tx to completion.
    ///
    /// Recoverable TXes will remain in the on-disk log until they are explicitly committed.
    #[must_use]
    async fn pop_one_recoverable_tx(&'a self) -> Option<Self::Guard>;

    /// Get the data associated with a given digest - returns an error if no such transaction is
    /// currently open.
    /// Requires a TxGuard to prevent asking about transactions that aren't in the log.
    fn get_tx_data(&self, g: &Self::Guard) -> SuiResult<C>;
}

pub struct DBTxGuard<'a, C: Serialize + DeserializeOwned> {
    tx: TransactionDigest,
    _mutex_guard: LockGuard<'a>,
    wal: &'a DBWriteAheadLog<C>,
    dead: bool,
}

impl<'a, C> DBTxGuard<'a, C>
where
    C: Serialize + DeserializeOwned,
{
    fn new(
        tx: &TransactionDigest,
        _mutex_guard: LockGuard<'a>,
        wal: &'a DBWriteAheadLog<C>,
    ) -> Self {
        Self {
            tx: *tx,
            _mutex_guard,
            wal,
            dead: false,
        }
    }
}

impl<'a, C> TxGuard<'a> for DBTxGuard<'a, C>
where
    C: Serialize + DeserializeOwned,
{
    fn tx_id(&self) -> TransactionDigest {
        self.tx
    }

    fn commit_tx(mut self) -> SuiResult {
        self.dead = true;
        self.wal.commit_tx(&self.tx)
    }
}

impl<C> Drop for DBTxGuard<'_, C>
where
    C: Serialize + DeserializeOwned,
{
    fn drop(&mut self) {
        if !self.dead {
            let tx = self.tx;
            error!(digest = ?tx, "DBTxGuard dropped without explicit commit");
            self.wal.implicit_drop_tx(&tx);
        }
    }
}

// A WriteAheadLog implementation built on rocksdb.
pub struct DBWriteAheadLog<C> {
    log: DBMap<TransactionDigest, C>,

    // Can't use tokio Mutex - must be accessible synchronously from drop trait.
    // Only acquire this lock in sync functions to make sure we don't hold it across an await.
    recoverable_txes: Mutex<Vec<TransactionDigest>>,

    // Guards the get/set in begin_tx
    mutex_table: MutexTable<TransactionDigest>,
}

const MUTEX_TABLE_SIZE: usize = 1024;

impl<C> DBWriteAheadLog<C>
where
    C: Serialize + DeserializeOwned,
{
    pub fn new<P: AsRef<Path>>(path: P) -> Self {
        let (options, _) = default_db_options(None);
        let db = {
            let path = &path;
            let db_options = Some(options.clone());
            let opt_cfs: &[(&str, &rocksdb::Options)] = &[("tx_write_ahead_log", &options)];
            typed_store::rocks::open_cf_opts(path, db_options, opt_cfs)
        }
        .expect("Cannot open DB.");

        let log: DBMap<TransactionDigest, C> =
            DBMap::reopen(&db, Some("tx_write_ahead_log")).expect("Cannot open CF.");

        // Read in any digests that were left in the log, e.g. due to a crash.
        //
        // This list will normally be small - it will typically only include txes that were
        // in-progress when we crashed.
        //
        // If, however, we were hitting repeated errors while trying to store txes, we could have
        // accumulated many txes in this list.
        let recoverable_txes: Vec<_> = log.iter().map(|(tx, _)| tx).collect();

        Self {
            log,
            recoverable_txes: Mutex::new(recoverable_txes),
            mutex_table: MutexTable::new(MUTEX_TABLE_SIZE),
        }
    }

    fn commit_tx(&self, tx: &TransactionDigest) -> SuiResult {
        debug!(digest = ?tx, "committing tx");
        self.log.remove(tx).map_err(|e| e.into())
    }

    fn implicit_drop_tx(&self, tx: &TransactionDigest) {
        // this function should be called very rarely so contention should not be an issue.
        // unwrap ok because it is not safe to continue running if the mutex is poisoned.
        let mut r = self.recoverable_txes.lock().unwrap();
        r.push(*tx);
    }

    fn pop_one_tx(&self) -> Option<TransactionDigest> {
        // Only acquire this lock inside a sync function to make sure we don't accidentally
        // hold it across an .await
        self.recoverable_txes.lock().unwrap().pop()
    }
}

#[async_trait]
impl<'a, C: 'a> WriteAheadLog<'a, C> for DBWriteAheadLog<C>
where
    C: Serialize + DeserializeOwned + std::marker::Send + std::marker::Sync,
{
    type Guard = DBTxGuard<'a, C>;

    #[must_use]
    async fn begin_tx(
        &'a self,
        tx: &TransactionDigest,
        cert: &C,
    ) -> SuiResult<Option<DBTxGuard<'a, C>>> {
        let mutex_guard = self.mutex_table.acquire_lock(tx).await;

        if self.log.contains_key(tx)? {
            // A concurrent tx will have held the mutex guard until it finished. If the tx is
            // committed it is removed from the log. This means that if the tx is still in the
            // log, it was dropped (errored out) and not committed. Return None to indicate
            // that the caller does not hold a guard on this tx and cannot proceed.
            //
            // (The dropped tx must be retried later by calling pop_one_recoverable_tx() and
            // obtaining a TxGuard).
            return Ok(None);
        }

        self.log.insert(tx, cert)?;

        Ok(Some(DBTxGuard::new(tx, mutex_guard, self)))
    }

    #[must_use]
    async fn pop_one_recoverable_tx(&'a self) -> Option<DBTxGuard<'a, C>> {
        let candidate = self.pop_one_tx();

        match candidate {
            None => None,
            Some(digest) => {
                let guard = self.mutex_table.acquire_lock(&digest).await;
                Some(DBTxGuard::new(&digest, guard, self))
            }
        }
    }

    fn get_tx_data(&self, g: &DBTxGuard<'a, C>) -> SuiResult<C> {
        self.log
            .get(&g.tx)
            .map_err(SuiError::from)?
            .ok_or(SuiError::TransactionNotFound { digest: g.tx })
    }
}

#[cfg(test)]
mod tests {

    use crate::write_ahead_log::{DBWriteAheadLog, TxGuard, WriteAheadLog};
    use anyhow;
    use sui_types::base_types::TransactionDigest;

    async fn recover_queue_empty(log: &DBWriteAheadLog<u32>) -> bool {
        log.pop_one_recoverable_tx().await.is_none()
    }

    #[tokio::test]
    async fn test_write_ahead_log() -> Result<(), anyhow::Error> {
        let working_dir = tempfile::tempdir()?;

        let tx1_id = TransactionDigest::random();
        let tx2_id = TransactionDigest::random();
        let tx3_id = TransactionDigest::random();

        {
            let log: DBWriteAheadLog<u32> = DBWriteAheadLog::new(&working_dir);
            assert!(recover_queue_empty(&log).await);

            let tx1 = log.begin_tx(&tx1_id, &1).await?.unwrap();
            tx1.commit_tx().unwrap();

            let tx2 = log.begin_tx(&tx2_id, &2).await?.unwrap();
            tx2.commit_tx().unwrap();

            {
                let _tx3 = log.begin_tx(&tx3_id, &3).await?.unwrap();
                // implicit drop
            }

            let r = log.pop_one_recoverable_tx().await.unwrap();
            // tx3 in recoverable txes because we dropped the guard.
            assert_eq!(r.tx_id(), tx3_id);

            // verify previous call emptied the recoverable list
            assert!(recover_queue_empty(&log).await);
        }

        {
            // recover the log
            let log: DBWriteAheadLog<u32> = DBWriteAheadLog::new(&working_dir);

            // recoverable txes still there
            let r = log.pop_one_recoverable_tx().await.unwrap();
            assert_eq!(r.tx_id(), tx3_id);
            assert_eq!(log.get_tx_data(&r).unwrap(), 3);
            assert!(recover_queue_empty(&log).await);

            // commit the recoverable tx
            r.commit_tx().unwrap();
        }

        {
            // recover the log again
            let log: DBWriteAheadLog<u32> = DBWriteAheadLog::new(&working_dir);
            // empty, because we committed the tx before.
            assert!(recover_queue_empty(&log).await);
        }

        Ok(())
    }
}
