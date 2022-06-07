// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
use super::*;

use std::{
    collections::BTreeSet,
    sync::atomic::{AtomicBool, AtomicU64},
};
use sui_types::batch::TxSequenceNumber;

use tokio::sync::Notify;
use typed_store::traits::Map;

use parking_lot::Mutex;

pub struct TransactionNotifier {
    state: Arc<AuthorityStore>,
    low_watermark: AtomicU64,
    notify: Notify,
    has_stream: AtomicBool,
    is_closed: AtomicBool,
    inner: Mutex<LockedNotifier>,
}

struct LockedNotifier {
    high_watermark: u64,
    live_tickets: BTreeSet<TxSequenceNumber>,
}

impl TransactionNotifier {
    /// Create a new transaction notifier for the authority store
    pub fn new(state: Arc<AuthorityStore>) -> SuiResult<TransactionNotifier> {
        let seq = state.next_sequence_number()?;
        Ok(TransactionNotifier {
            state,
            low_watermark: AtomicU64::new(seq),
            notify: Notify::new(),
            has_stream: AtomicBool::new(false),
            is_closed: AtomicBool::new(false),

            // Keep a set of the tickets that are still being processed
            // This is the size of the number of concurrent processes.
            inner: Mutex::new(LockedNotifier {
                high_watermark: seq,
                live_tickets: BTreeSet::new(),
            }),
        })
    }

    pub fn low_watermark(&self) -> TxSequenceNumber {
        self.low_watermark.load(Ordering::SeqCst)
    }

    // TODO: Return a future instead so that the caller can await for.
    pub fn ticket_drained(&self) -> bool {
        self.inner.lock().high_watermark == self.low_watermark.load(Ordering::SeqCst)
    }

    /// Get a ticket with a sequence number
    pub fn ticket(self: &Arc<Self>) -> SuiResult<TransactionNotifierTicket> {
        if self.is_closed.load(Ordering::SeqCst) {
            return Err(SuiError::ClosedNotifierError);
        }

        let mut inner = self.inner.lock();
        // Insert the ticket into the set of live tickets.
        let seq = inner.high_watermark;
        inner.high_watermark += 1;
        inner.live_tickets.insert(seq);
        Ok(TransactionNotifierTicket {
            transaction_notifier: self.clone(),
            seq,
        })
    }

    /// Get an iterator, and return an error if an iterator for this stream already exists.
    pub fn iter_from(
        self: &Arc<Self>,
        next_seq: u64,
    ) -> SuiResult<impl futures::Stream<Item = (TxSequenceNumber, ExecutionDigests)> + Unpin> {
        if self
            .has_stream
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_err()
        {
            return Err(SuiError::ConcurrentIteratorError);
        }

        // The state we inject in the async stream
        let transaction_notifier = self.clone();
        let temp_buffer: VecDeque<(TxSequenceNumber, ExecutionDigests)> = VecDeque::new();
        let uniqueness_guard = IterUniquenessGuard(transaction_notifier.clone());
        let initial_state = (
            transaction_notifier,
            temp_buffer,
            next_seq,
            uniqueness_guard,
        );

        Ok(Box::pin(futures::stream::unfold(
            initial_state,
            |state| async move {
                let (transaction_notifier, mut temp_buffer, mut next_seq, uniqueness_guard) = state;

                loop {
                    // If we have data in the buffer return that first
                    if let Some(item) = temp_buffer.pop_front() {
                        return Some((
                            item,
                            (
                                transaction_notifier,
                                temp_buffer,
                                next_seq,
                                uniqueness_guard,
                            ),
                        ));
                    }

                    // Always stop at low watermark guarantees that transactions are
                    // always returned in order.
                    let last_safe = transaction_notifier.low_watermark();

                    // Get the stream of updates since the last point we requested ...
                    if let Ok(iter) = transaction_notifier
                        .clone()
                        .state
                        .executed_sequence
                        .iter()
                        .skip_to(&next_seq)
                    {
                        // ... continued here with take_while. And expand the buffer with the new items.
                        temp_buffer.extend(
                            iter.take_while(|(tx_seq, _tx_digest)| *tx_seq < last_safe)
                                .map(|(tx_seq, _tx_digest)| (tx_seq, _tx_digest)),
                        );

                        // Update what the next item would be to no re-read messages in the buffer
                        if !temp_buffer.is_empty() {
                            next_seq = temp_buffer[temp_buffer.len() - 1].0 + 1;
                        }

                        // If we have data in the buffer return that first
                        if let Some(item) = temp_buffer.pop_front() {
                            return Some((
                                item,
                                (
                                    transaction_notifier,
                                    temp_buffer,
                                    next_seq,
                                    uniqueness_guard,
                                ),
                            ));
                        } else {
                            // If the notifier is closed, then exit
                            if transaction_notifier
                                .is_closed
                                .load(std::sync::atomic::Ordering::SeqCst)
                            {
                                return None;
                            }
                        }
                    } else {
                        return None;
                    }

                    // Wait for a notification to get more data
                    transaction_notifier.notify.notified().await;
                }
            },
        )))
    }

    /// Signal we want to close this channel.
    pub fn close(&self) {
        self.is_closed
            .store(true, std::sync::atomic::Ordering::SeqCst);
        self.notify.notify_one();
    }
}

struct IterUniquenessGuard(Arc<TransactionNotifier>);

impl Drop for IterUniquenessGuard {
    fn drop(&mut self) {
        self.0
            .has_stream
            .store(false, std::sync::atomic::Ordering::SeqCst);
    }
}

pub struct TransactionNotifierTicket {
    transaction_notifier: Arc<TransactionNotifier>,
    seq: u64,
}

impl TransactionNotifierTicket {
    /// Get the ticket sequence number
    pub fn seq(&self) -> u64 {
        self.seq
    }
}

/// A custom drop to notify authority state's transaction_notifier
/// that a new certified transaction's has just been executed and committed.
impl Drop for TransactionNotifierTicket {
    fn drop(&mut self) {
        let mut inner = self.transaction_notifier.inner.lock();
        inner.live_tickets.remove(&self.seq);

        // The new low watermark is either the lowest outstanding ticket
        // or the high watermark.
        let new_low_watermark = *inner
            .live_tickets
            .iter()
            .next()
            .unwrap_or(&inner.high_watermark);

        self.transaction_notifier
            .low_watermark
            .store(new_low_watermark, std::sync::atomic::Ordering::SeqCst);
        self.transaction_notifier.notify.notify_one();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use futures::StreamExt;
    use std::env;
    use std::fs;

    use std::time::Duration;
    use tokio::time::timeout;

    #[tokio::test]
    async fn test_notifier() {
        let dir = env::temp_dir();
        let path = dir.join(format!("DB_{:?}", ObjectID::random()));
        fs::create_dir(&path).unwrap();

        let store = Arc::new(AuthorityStore::open(path, None));

        let notifier = Arc::new(TransactionNotifier::new(store.clone()).unwrap());

        // TEST 1: Happy sequence

        {
            let t0 = &notifier.ticket().expect("ok");
            store.side_sequence(t0.seq(), &ExecutionDigests::random());
        }

        {
            let t0 = &notifier.ticket().expect("ok");
            store.side_sequence(t0.seq(), &ExecutionDigests::random());
        }

        {
            let t0 = &notifier.ticket().expect("ok");
            store.side_sequence(t0.seq(), &ExecutionDigests::random());
        }

        let mut iter = notifier.iter_from(0).unwrap();

        // Trying to take a second concurrent stream fails.
        assert!(matches!(
            notifier.iter_from(0),
            Err(SuiError::ConcurrentIteratorError)
        ));

        assert!(matches!(iter.next().await, Some((0, _))));
        assert!(matches!(iter.next().await, Some((1, _))));
        assert!(matches!(iter.next().await, Some((2, _))));

        assert!(timeout(Duration::from_millis(10), iter.next())
            .await
            .is_err());

        // TEST 2: Drop a ticket

        {
            let t0 = &notifier.ticket().expect("ok");
            assert!(t0.seq() == 3);
        }

        {
            let t0 = &notifier.ticket().expect("ok");
            store.side_sequence(t0.seq(), &ExecutionDigests::random());
        }

        let x = iter.next().await;
        assert!(matches!(x, Some((4, _))));

        assert!(timeout(Duration::from_millis(10), iter.next())
            .await
            .is_err());

        // TEST 3: Drop & out of order

        let t5 = notifier.ticket().expect("ok");
        let t6 = notifier.ticket().expect("ok");
        let t7 = notifier.ticket().expect("ok");
        let t8 = notifier.ticket().expect("ok");

        store.side_sequence(t6.seq(), &ExecutionDigests::random());
        drop(t6);

        store.side_sequence(t5.seq(), &ExecutionDigests::random());
        drop(t5);

        drop(t7);

        store.side_sequence(t8.seq(), &ExecutionDigests::random());
        drop(t8);

        assert!(matches!(iter.next().await, Some((5, _))));
        assert!(matches!(iter.next().await, Some((6, _))));
        assert!(matches!(iter.next().await, Some((8, _))));

        assert!(timeout(Duration::from_millis(10), iter.next())
            .await
            .is_err());

        drop(iter);

        // After we drop an iterator we can get another one
        assert!(notifier.iter_from(0).is_ok());
    }
}
