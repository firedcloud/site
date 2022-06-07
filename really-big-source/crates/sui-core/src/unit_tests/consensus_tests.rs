// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
use super::*;
use crate::authority::{authority_tests::init_state_with_objects, AuthorityState};
use move_core_types::{account_address::AccountAddress, ident_str};
use narwhal_executor::{ExecutionIndices, ExecutionState};
use narwhal_types::Transactions;
use narwhal_types::TransactionsServer;
use narwhal_types::{Empty, TransactionProto};
use sui_network::tonic;
use sui_types::{
    base_types::{ObjectID, TransactionDigest},
    crypto::Signature,
    gas_coin::GasCoin,
    messages::{CallArg, CertifiedTransaction, SignatureAggregator, Transaction, TransactionData},
    object::{MoveObject, Object, Owner, OBJECT_START_VERSION},
};
use test_utils::test_keys;
use tokio::sync::mpsc::channel;

/// Fixture: a few test gas objects.
pub fn test_gas_objects() -> Vec<Object> {
    (0..4)
        .map(|i| {
            let seed = format!("0x555555555555555{i}");
            let gas_object_id = ObjectID::from_hex_literal(&seed).unwrap();
            let (sender, _) = test_keys().pop().unwrap();
            Object::with_id_owner_for_testing(gas_object_id, sender)
        })
        .collect()
}

/// Fixture: a a test shared object.
pub fn test_shared_object() -> Object {
    let seed = "0x6666666666666660";
    let shared_object_id = ObjectID::from_hex_literal(seed).unwrap();
    let content = GasCoin::new(shared_object_id, OBJECT_START_VERSION, 10);
    let obj = MoveObject::new(/* type */ GasCoin::type_(), content.to_bcs_bytes());
    Object::new_move(obj, Owner::Shared, TransactionDigest::genesis())
}

/// Fixture: a few test certificates containing a shared object.
pub async fn test_certificates(authority: &AuthorityState) -> Vec<CertifiedTransaction> {
    let (sender, keypair) = test_keys().pop().unwrap();

    let mut certificates = Vec::new();
    let shared_object_id = test_shared_object().id();
    for gas_object in test_gas_objects() {
        // Make a sample transaction.
        let module = "ObjectBasics";
        let function = "create";
        let package_object_ref = authority.get_framework_object_ref().await.unwrap();

        let data = TransactionData::new_move_call(
            sender,
            package_object_ref,
            ident_str!(module).to_owned(),
            ident_str!(function).to_owned(),
            /* type_args */ vec![],
            gas_object.compute_object_reference(),
            /* args */
            vec![
                CallArg::SharedObject(shared_object_id),
                CallArg::Pure(16u64.to_le_bytes().to_vec()),
                CallArg::Pure(bcs::to_bytes(&AccountAddress::from(sender)).unwrap()),
            ],
            /* max_gas */ 10_000,
        );
        let signature = Signature::new(&data, &keypair);
        let transaction = Transaction::new(data, signature);

        // Submit the transaction and assemble a certificate.
        let response = authority
            .handle_transaction(transaction.clone())
            .await
            .unwrap();
        let vote = response.signed_transaction.unwrap();
        let certificate = SignatureAggregator::try_new(transaction, &authority.committee.load())
            .unwrap()
            .append(vote.auth_sign_info.authority, vote.auth_sign_info.signature)
            .unwrap()
            .unwrap();
        certificates.push(certificate);
    }
    certificates
}

#[tokio::test]
async fn listen_to_sequenced_transaction() {
    let (tx_sui_to_consensus, rx_sui_to_consensus) = channel(1);
    let (tx_consensus_to_sui, rx_consensus_to_sui) = channel(1);

    // Make an authority state.
    let mut objects = test_gas_objects();
    objects.push(test_shared_object());
    let state = init_state_with_objects(objects).await;

    // Make a sample (serialized) consensus transaction.
    let certificate = Box::new(test_certificates(&state).await.pop().unwrap());
    let message = ConsensusTransaction::UserTransaction(certificate.clone());
    let serialized = bincode::serialize(&message).unwrap();

    // Set the shared object locks.
    state
        .handle_consensus_transaction(
            ExecutionIndices::default(),
            ConsensusTransaction::UserTransaction(certificate),
        )
        .await
        .unwrap();

    // Spawn a consensus listener.
    ConsensusListener::spawn(
        /* rx_consensus_input */ rx_sui_to_consensus,
        /* rx_consensus_output */ rx_consensus_to_sui,
        /* max_pending_transactions */ 100,
    );

    // Submit a sample consensus transaction.
    let (sender, receiver) = oneshot::channel();
    let message = ConsensusListenerMessage::New(serialized.clone(), sender);
    tx_sui_to_consensus.send(message).await.unwrap();

    // Notify the consensus listener that the transaction has been sequenced.
    tokio::task::yield_now().await;
    let output = (Ok(Vec::default()), serialized);
    tx_consensus_to_sui.send(output).await.unwrap();

    // Ensure the caller get notified from the consensus listener.
    assert!(receiver.await.unwrap().is_ok());
}

#[tokio::test]
async fn submit_transaction_to_consensus() {
    // TODO [issue #932]: Use a port allocator to avoid port conflicts.
    let consensus_address: Multiaddr = "/dns/localhost/tcp/12456/http".parse().unwrap();
    let (tx_consensus_listener, mut rx_consensus_listener) = channel(1);

    // Initialize an authority with a (owned) gas object and a shared object; then
    // make a test certificate.
    let mut objects = test_gas_objects();
    objects.push(test_shared_object());
    let state = init_state_with_objects(objects).await;
    let certificate = test_certificates(&state).await.pop().unwrap();
    let expected_transaction = certificate.clone().to_transaction();

    let committee = state.clone_committee();
    let state_guard = Arc::new(state);

    // Make a new consensus submitter instance.
    let submitter = ConsensusAdapter::new(
        state_guard.clone(),
        consensus_address.clone(),
        committee,
        tx_consensus_listener,
        /* max_delay */ Duration::from_millis(1_000),
    );

    // Spawn a network listener to receive the transaction (emulating the consensus node).
    let mut handle = ConsensusMockServer::spawn(consensus_address);

    // Notify the submitter when a consensus transaction has been sequenced and executed.
    tokio::spawn(async move {
        while let Some(message) = rx_consensus_listener.recv().await {
            let (serialized, replier) = match message {
                ConsensusListenerMessage::New(serialized, replier) => (serialized, replier),
                message => panic!("Unexpected message {message:?}"),
            };

            let message =
                bincode::deserialize(&serialized).expect("Failed to deserialize consensus tx");
            let certificate = match message {
                ConsensusTransaction::UserTransaction(certificate) => certificate,
                _ => panic!("Unexpected message {message:?}"),
            };

            // Set the shared object locks.
            state_guard
                .handle_consensus_transaction(
                    ExecutionIndices::default(),
                    ConsensusTransaction::UserTransaction(certificate.clone()),
                )
                .await
                .unwrap();

            // Reply to the submitter.
            let result = Ok(Vec::default());
            replier.send(result).unwrap();
        }
    });

    // Submit the transaction and ensure the submitter reports success to the caller. Note
    // that consensus may drop some transactions (so we may need to resubmit them).
    let consensus_transaction = ConsensusTransaction::UserTransaction(Box::new(certificate));
    loop {
        match submitter.submit(&consensus_transaction).await {
            Ok(_) => break,
            Err(SuiError::ConsensusConnectionBroken(..)) => (),
            Err(e) => panic!("Unexpected error message: {e}"),
        }
    }

    // Ensure the consensus node got the transaction.
    let bytes = handle.recv().await.unwrap().transaction;
    let message = bincode::deserialize(&bytes).unwrap();
    match message {
        ConsensusTransaction::UserTransaction(x) => {
            assert_eq!(x.to_transaction(), expected_transaction)
        }
        _ => panic!("Unexpected message {message:?}"),
    }
}

pub struct ConsensusMockServer {
    sender: Sender<TransactionProto>,
}

impl ConsensusMockServer {
    pub fn spawn(address: Multiaddr) -> Receiver<TransactionProto> {
        let (sender, receiver) = channel(1);
        tokio::spawn(async move {
            let config = mysten_network::config::Config::new();
            let mock = Self { sender };
            config
                .server_builder()
                .add_service(TransactionsServer::new(mock))
                .bind(&address)
                .await
                .unwrap()
                .serve()
                .await
        });
        receiver
    }
}

#[tonic::async_trait]
impl Transactions for ConsensusMockServer {
    /// Submit a Transactions
    async fn submit_transaction(
        &self,
        request: tonic::Request<TransactionProto>,
    ) -> Result<tonic::Response<Empty>, tonic::Status> {
        self.sender.send(request.into_inner()).await.unwrap();
        Ok(tonic::Response::new(Empty {}))
    }
    /// Submit a Transactions
    async fn submit_transaction_stream(
        &self,
        _request: tonic::Request<tonic::Streaming<TransactionProto>>,
    ) -> Result<tonic::Response<Empty>, tonic::Status> {
        unimplemented!()
    }
}
