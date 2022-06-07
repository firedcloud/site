// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use std::sync::Arc;
use sui_storage::write_ahead_log::{DBWriteAheadLog, TxGuard, WriteAheadLog};
use sui_types::base_types::TransactionDigest;
use tokio::runtime::Builder;
use tokio::time::{sleep, Duration};

fn main() {
    let runtime = Builder::new_multi_thread()
        .enable_all()
        .thread_stack_size(32 * 1024 * 1024)
        .worker_threads(usize::min(num_cpus::get(), 24))
        .build()
        .unwrap();

    let working_dir = tempfile::tempdir().unwrap();
    let wal = Arc::new(DBWriteAheadLog::<usize>::new(working_dir));

    let num_tasks = 20000;
    let num_txes_per_task = 10;

    let start = std::time::Instant::now();

    // TODO: this is not a very good benchmark but perhaps it can at least find regressions
    runtime.block_on(async move {
        let mut futures = Vec::new();
        for _ in 0..num_tasks {
            let wal = wal.clone();
            futures.push(tokio::spawn(async move {
                for _ in 0..num_txes_per_task {
                    let tx = TransactionDigest::random();
                    let g = wal.begin_tx(&tx, &0).await.unwrap();

                    if let Some(g) = g {
                        sleep(Duration::from_millis(1)).await;
                        g.commit_tx().unwrap();
                    }
                }
            }));
        }

        while let Some(f) = futures.pop() {
            f.await.unwrap();
        }
    });

    let duration = start.elapsed();

    println!(
        "WriteAheadLog throughput: {} txes/s",
        (num_tasks * num_txes_per_task) as f64 / duration.as_secs_f64()
    );
}
