// Copyright (c) 2021, Facebook, Inc. and its affiliates
// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use super::*;
use bcs;
use move_binary_format::{
    file_format::{self, AddressIdentifierIndex, IdentifierIndex, ModuleHandle},
    CompiledModule,
};
use move_core_types::{
    account_address::AccountAddress, ident_str, identifier::Identifier, language_storage::TypeTag,
};
use narwhal_executor::ExecutionIndices;
use rand::{prelude::StdRng, SeedableRng};
use sui_adapter::genesis;
use sui_types::{
    base_types::dbg_addr,
    crypto::KeyPair,
    crypto::{get_key_pair, Signature},
    messages::Transaction,
    object::{Owner, OBJECT_START_VERSION},
    sui_system_state::SuiSystemState,
    SUI_SYSTEM_STATE_OBJECT_ID,
};

use std::fs;
use std::{convert::TryInto, env};

pub enum TestCallArg {
    Object(ObjectID),
    U64(u64),
    Address(SuiAddress),
}

impl TestCallArg {
    pub async fn to_call_arg(self, state: &AuthorityState) -> CallArg {
        match self {
            Self::Object(object_id) => {
                let object = state.get_object(&object_id).await.unwrap().unwrap();
                if object.is_shared() {
                    CallArg::SharedObject(object_id)
                } else {
                    CallArg::ImmOrOwnedObject(object.compute_object_reference())
                }
            }
            Self::U64(value) => CallArg::Pure(bcs::to_bytes(&value).unwrap()),
            Self::Address(addr) => {
                CallArg::Pure(bcs::to_bytes(&AccountAddress::from(addr)).unwrap())
            }
        }
    }
}

const MAX_GAS: u64 = 10000;

// Only relevant in a ser/de context : the `CertifiedTransaction` for a transaction is not unique
fn compare_certified_transactions(o1: &CertifiedTransaction, o2: &CertifiedTransaction) {
    assert_eq!(o1.digest(), o2.digest());
    // in this ser/de context it's relevant to compare signatures
    assert_eq!(o1.auth_sign_info.signatures, o2.auth_sign_info.signatures);
}

// Only relevant in a ser/de context : the `CertifiedTransaction` for a transaction is not unique
fn compare_transaction_info_responses(o1: &TransactionInfoResponse, o2: &TransactionInfoResponse) {
    assert_eq!(o1.signed_transaction, o2.signed_transaction);
    assert_eq!(o1.signed_effects, o2.signed_effects);
    match (
        o1.certified_transaction.as_ref(),
        o2.certified_transaction.as_ref(),
    ) {
        (Some(cert1), Some(cert2)) => {
            assert_eq!(cert1.digest(), cert2.digest());
            assert_eq!(
                cert1.auth_sign_info.signatures,
                cert2.auth_sign_info.signatures
            );
        }
        (None, None) => (),
        _ => panic!("certificate structure between responses differs"),
    }
}

#[tokio::test]
async fn test_handle_transfer_transaction_bad_signature() {
    let (sender, sender_key) = get_key_pair();
    let recipient = dbg_addr(2);
    let object_id = ObjectID::random();
    let gas_object_id = ObjectID::random();
    let authority_state =
        init_state_with_ids(vec![(sender, object_id), (sender, gas_object_id)]).await;
    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let gas_object = authority_state
        .get_object(&gas_object_id)
        .await
        .unwrap()
        .unwrap();
    let transfer_transaction = init_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
    );

    let num_orders = authority_state.metrics.tx_orders.get();
    let num_errors = authority_state.metrics.signature_errors.get();

    let (_unknown_address, unknown_key) = get_key_pair();
    let mut bad_signature_transfer_transaction = transfer_transaction.clone();
    bad_signature_transfer_transaction.tx_signature =
        Signature::new(&transfer_transaction.data, &unknown_key);
    assert!(authority_state
        .handle_transaction(bad_signature_transfer_transaction)
        .await
        .is_err());

    // Check that metrics were increased
    let num_orders = authority_state.metrics.tx_orders.get() - num_orders;
    // For some reason this is sometimes more than 1, maybe tests running in parallel
    assert!(num_orders > 0);
    assert_eq!(
        authority_state.metrics.signature_errors.get() - num_errors,
        1
    );

    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    assert!(authority_state
        .get_transaction_lock(&object.compute_object_reference())
        .await
        .unwrap()
        .is_none());

    assert!(authority_state
        .get_transaction_lock(&object.compute_object_reference())
        .await
        .unwrap()
        .is_none());
}

#[tokio::test]
async fn test_handle_transfer_transaction_unknown_sender() {
    let sender = get_new_address();
    let (unknown_address, unknown_key) = get_key_pair();
    let object_id: ObjectID = ObjectID::random();
    let gas_object_id = ObjectID::random();
    let recipient = dbg_addr(2);
    let authority_state =
        init_state_with_ids(vec![(sender, object_id), (sender, gas_object_id)]).await;
    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let gas_object = authority_state
        .get_object(&gas_object_id)
        .await
        .unwrap()
        .unwrap();

    let unknown_sender_transfer_transaction = init_transfer_transaction(
        unknown_address,
        &unknown_key,
        recipient,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
    );

    assert!(authority_state
        .handle_transaction(unknown_sender_transfer_transaction)
        .await
        .is_err());

    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    assert!(authority_state
        .get_transaction_lock(&object.compute_object_reference())
        .await
        .unwrap()
        .is_none());

    assert!(authority_state
        .get_transaction_lock(&object.compute_object_reference())
        .await
        .unwrap()
        .is_none());
}

/* FIXME: This tests the submission of out of transaction certs, but modifies object sequence numbers manually
   and leaves the authority in an inconsistent state. We should re-code it in a proper way.

#[test]
fn test_handle_transfer_transaction_bad_sequence_number() {
    let (sender, sender_key) = get_key_pair();
    let object_id: ObjectID = random_object_id();
    let recipient = Address::Sui(dbg_addr(2));
    let authority_state = init_state_with_object(sender, object_id);
    let transfer_transaction = init_transfer_transaction(sender, &sender_key, recipient, object_id);

    let mut sequence_number_state = authority_state;
    let sequence_number_state_sender_account =
        sequence_number_state.objects.get_mut(&object_id).unwrap();
    sequence_number_state_sender_account.version() =
        sequence_number_state_sender_account
            .version()
            .increment()
            .unwrap();
    assert!(sequence_number_state
        .handle_transfer_transaction(transfer_transaction)
        .is_err());

        let object = sequence_number_state.objects.get(&object_id).unwrap();
        assert!(sequence_number_state.get_transaction_lock(object.id, object.version()).unwrap().is_none());
}
*/

#[tokio::test]
async fn test_handle_transfer_transaction_ok() {
    let (sender, sender_key) = get_key_pair();
    let recipient = dbg_addr(2);
    let object_id = ObjectID::random();
    let gas_object_id = ObjectID::random();
    let authority_state =
        init_state_with_ids(vec![(sender, object_id), (sender, gas_object_id)]).await;
    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let gas_object = authority_state
        .get_object(&gas_object_id)
        .await
        .unwrap()
        .unwrap();
    let transfer_transaction = init_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
    );

    let test_object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();

    // Check the initial state of the locks
    assert!(authority_state
        .get_transaction_lock(&(object_id, 0.into(), test_object.digest()))
        .await
        .unwrap()
        .is_none());
    assert!(authority_state
        .get_transaction_lock(&(object_id, 1.into(), test_object.digest()))
        .await
        .is_err());

    let account_info = authority_state
        .handle_transaction(transfer_transaction.clone())
        .await
        .unwrap();

    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let pending_confirmation = authority_state
        .get_transaction_lock(&object.compute_object_reference())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(
        account_info.signed_transaction.unwrap(),
        pending_confirmation
    );

    // Check the final state of the locks
    assert!(authority_state
        .get_transaction_lock(&(object_id, 0.into(), object.digest()))
        .await
        .unwrap()
        .is_some());
    assert_eq!(
        authority_state
            .get_transaction_lock(&(object_id, 0.into(), object.digest()))
            .await
            .unwrap()
            .as_ref()
            .unwrap()
            .data,
        transfer_transaction.data
    );
}

#[tokio::test]
async fn test_transfer_package() {
    let (sender, sender_key) = get_key_pair();
    let recipient = dbg_addr(2);
    let object_id = ObjectID::random();
    let authority_state = init_state_with_ids(vec![(sender, object_id)]).await;
    let gas_object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let package_object_ref = authority_state.get_framework_object_ref().await.unwrap();
    // We are trying to transfer the genesis package object, which is immutable.
    let transfer_transaction = init_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        package_object_ref,
        gas_object.compute_object_reference(),
    );
    let result = authority_state
        .handle_transaction(transfer_transaction.clone())
        .await;
    assert_eq!(result.unwrap_err(), SuiError::TransferUnownedError);
}

// This test attempts to use an immutable gas object to pay for gas.
// We expect it to fail early during transaction handle phase.
#[tokio::test]
async fn test_immutable_gas() {
    let (sender, sender_key) = get_key_pair();
    let recipient = dbg_addr(2);
    let mut_object_id = ObjectID::random();
    let authority_state = init_state_with_ids(vec![(sender, mut_object_id)]).await;
    let imm_object_id = ObjectID::random();
    let imm_object = Object::immutable_with_id_for_testing(imm_object_id);
    authority_state
        .insert_genesis_object(imm_object.clone())
        .await;
    let mut_object = authority_state
        .get_object(&mut_object_id)
        .await
        .unwrap()
        .unwrap();
    let transfer_transaction = init_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        mut_object.compute_object_reference(),
        imm_object.compute_object_reference(),
    );
    let result = authority_state
        .handle_transaction(transfer_transaction.clone())
        .await;
    assert!(matches!(
        result.unwrap_err(),
        SuiError::InsufficientGas { .. }
    ));
}

pub async fn send_and_confirm_transaction(
    authority: &AuthorityState,
    transaction: Transaction,
) -> Result<TransactionInfoResponse, SuiError> {
    // Make the initial request
    let response = authority.handle_transaction(transaction.clone()).await?;
    let vote = response.signed_transaction.unwrap();

    // Collect signatures from a quorum of authorities
    let committee = authority.committee.load();
    let mut builder = SignatureAggregator::try_new(transaction, &committee).unwrap();
    let certificate = builder
        .append(vote.auth_sign_info.authority, vote.auth_sign_info.signature)
        .unwrap()
        .unwrap();
    // Submit the confirmation. *Now* execution actually happens, and it should fail when we try to look up our dummy module.
    // we unfortunately don't get a very descriptive error message, but we can at least see that something went wrong inside the VM
    authority
        .handle_confirmation_transaction(ConfirmationTransaction::new(certificate))
        .await
}

/// Create a `CompiledModule` that depends on `m`
fn make_dependent_module(m: &CompiledModule) -> CompiledModule {
    let mut dependent_module = file_format::empty_module();
    dependent_module
        .identifiers
        .push(m.self_id().name().to_owned());
    dependent_module
        .address_identifiers
        .push(*m.self_id().address());
    dependent_module.module_handles.push(ModuleHandle {
        address: AddressIdentifierIndex((dependent_module.address_identifiers.len() - 1) as u16),
        name: IdentifierIndex((dependent_module.identifiers.len() - 1) as u16),
    });
    dependent_module
}

// Test that publishing a module that depends on an existing one works
#[tokio::test]
async fn test_publish_dependent_module_ok() {
    let (sender, sender_key) = get_key_pair();
    let gas_payment_object_id = ObjectID::random();
    let gas_payment_object = Object::with_id_owner_for_testing(gas_payment_object_id, sender);
    let gas_payment_object_ref = gas_payment_object.compute_object_reference();
    // create a genesis state that contains the gas object and genesis modules
    let genesis_module_objects = genesis::clone_genesis_packages();
    let genesis_module = match &genesis_module_objects[0].data {
        Data::Package(m) => {
            CompiledModule::deserialize(m.serialized_module_map().values().next().unwrap()).unwrap()
        }
        _ => unreachable!(),
    };
    // create a module that depends on a genesis module
    let dependent_module = make_dependent_module(&genesis_module);
    let dependent_module_bytes = {
        let mut bytes = Vec::new();
        dependent_module.serialize(&mut bytes).unwrap();
        bytes
    };
    let authority = init_state_with_objects(vec![gas_payment_object]).await;

    let data = TransactionData::new_module(
        sender,
        gas_payment_object_ref,
        vec![dependent_module_bytes],
        MAX_GAS,
    );
    let signature = Signature::new(&data, &sender_key);
    let transaction = Transaction::new(data, signature);

    let dependent_module_id = TxContext::new(&sender, transaction.digest(), 0).fresh_id();

    // Object does not exist
    assert!(authority
        .get_object(&dependent_module_id)
        .await
        .unwrap()
        .is_none());
    let response = send_and_confirm_transaction(&authority, transaction)
        .await
        .unwrap();
    response.signed_effects.unwrap().effects.status.unwrap();

    // check that the dependent module got published
    assert!(authority.get_object(&dependent_module_id).await.is_ok());
}

// Test that publishing a module with no dependencies works
#[tokio::test]
async fn test_publish_module_no_dependencies_ok() {
    let (sender, sender_key) = get_key_pair();
    let gas_payment_object_id = ObjectID::random();
    let gas_balance = MAX_GAS;
    let gas_seq = SequenceNumber::new();
    let gas_payment_object =
        Object::with_id_owner_gas_for_testing(gas_payment_object_id, gas_seq, sender, gas_balance);
    let gas_payment_object_ref = gas_payment_object.compute_object_reference();
    let authority = init_state_with_objects(vec![gas_payment_object]).await;

    let module = file_format::empty_module();
    let mut module_bytes = Vec::new();
    module.serialize(&mut module_bytes).unwrap();
    let module_bytes = vec![module_bytes];
    let data = TransactionData::new_module(sender, gas_payment_object_ref, module_bytes, MAX_GAS);
    let signature = Signature::new(&data, &sender_key);
    let transaction = Transaction::new(data, signature);
    let _module_object_id = TxContext::new(&sender, transaction.digest(), 0).fresh_id();
    let response = send_and_confirm_transaction(&authority, transaction)
        .await
        .unwrap();
    response.signed_effects.unwrap().effects.status.unwrap();

    // check that the module actually got published
    assert!(response.certified_transaction.is_some());
}

#[tokio::test]
async fn test_publish_non_existing_dependent_module() {
    let (sender, sender_key) = get_key_pair();
    let gas_payment_object_id = ObjectID::random();
    let gas_payment_object = Object::with_id_owner_for_testing(gas_payment_object_id, sender);
    let gas_payment_object_ref = gas_payment_object.compute_object_reference();
    // create a genesis state that contains the gas object and genesis modules
    let genesis_module_objects = genesis::clone_genesis_packages();
    let genesis_module = match &genesis_module_objects[0].data {
        Data::Package(m) => {
            CompiledModule::deserialize(m.serialized_module_map().values().next().unwrap()).unwrap()
        }
        _ => unreachable!(),
    };
    // create a module that depends on a genesis module
    let mut dependent_module = make_dependent_module(&genesis_module);
    // Add another dependent module that points to a random address, hence does not exist on-chain.
    dependent_module
        .address_identifiers
        .push(AccountAddress::from(ObjectID::random()));
    dependent_module.module_handles.push(ModuleHandle {
        address: AddressIdentifierIndex((dependent_module.address_identifiers.len() - 1) as u16),
        name: IdentifierIndex(0),
    });
    let dependent_module_bytes = {
        let mut bytes = Vec::new();
        dependent_module.serialize(&mut bytes).unwrap();
        bytes
    };
    let authority = init_state_with_objects(vec![gas_payment_object]).await;

    let data = TransactionData::new_module(
        sender,
        gas_payment_object_ref,
        vec![dependent_module_bytes],
        MAX_GAS,
    );
    let signature = Signature::new(&data, &sender_key);
    let transaction = Transaction::new(data, signature);

    let response = authority.handle_transaction(transaction).await;
    assert!(std::string::ToString::to_string(&response.unwrap_err())
        .contains("DependentPackageNotFound"));
    // Check that gas was not charged.
    assert_eq!(
        authority
            .get_object(&gas_payment_object_id)
            .await
            .unwrap()
            .unwrap()
            .version(),
        gas_payment_object_ref.1
    );
}

#[tokio::test]
async fn test_handle_move_transaction() {
    let (sender, sender_key) = get_key_pair();
    let gas_payment_object_id = ObjectID::random();
    let gas_payment_object = Object::with_id_owner_for_testing(gas_payment_object_id, sender);
    let authority_state = init_state_with_objects(vec![gas_payment_object]).await;

    let effects = create_move_object(
        &authority_state,
        &gas_payment_object_id,
        &sender,
        &sender_key,
    )
    .await
    .unwrap();

    assert!(effects.status.is_ok());
    assert_eq!(effects.created.len(), 1);
    assert_eq!(effects.mutated.len(), 1);

    let created_object_id = effects.created[0].0 .0;
    // check that transaction actually created an object with the expected ID, owner, sequence number
    let created_obj = authority_state
        .get_object(&created_object_id)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(created_obj.owner, sender);
    assert_eq!(created_obj.id(), created_object_id);
    assert_eq!(created_obj.version(), OBJECT_START_VERSION);
}

#[tokio::test]
async fn test_handle_transfer_transaction_double_spend() {
    let (sender, sender_key) = get_key_pair();
    let recipient = dbg_addr(2);
    let object_id = ObjectID::random();
    let gas_object_id = ObjectID::random();
    let authority_state =
        init_state_with_ids(vec![(sender, object_id), (sender, gas_object_id)]).await;
    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let gas_object = authority_state
        .get_object(&gas_object_id)
        .await
        .unwrap()
        .unwrap();
    let transfer_transaction = init_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
    );

    let signed_transaction = authority_state
        .handle_transaction(transfer_transaction.clone())
        .await
        .unwrap();
    // calls to handlers are idempotent -- returns the same.
    let double_spend_signed_transaction = authority_state
        .handle_transaction(transfer_transaction)
        .await
        .unwrap();
    // this is valid because our test authority should not change its certified transaction
    compare_transaction_info_responses(&signed_transaction, &double_spend_signed_transaction);
}

#[tokio::test]
async fn test_handle_confirmation_transaction_unknown_sender() {
    let recipient = dbg_addr(2);
    let (sender, sender_key) = get_key_pair();
    let authority_state = init_state().await;

    let object = Object::with_id_owner_for_testing(
        ObjectID::random(),
        SuiAddress::random_for_testing_only(),
    );
    let gas_object = Object::with_id_owner_for_testing(
        ObjectID::random(),
        SuiAddress::random_for_testing_only(),
    );

    let certified_transfer_transaction = init_certified_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
        &authority_state,
    );

    assert!(authority_state
        .handle_confirmation_transaction(ConfirmationTransaction::new(
            certified_transfer_transaction
        ))
        .await
        .is_err());
}

#[ignore]
#[tokio::test]
async fn test_handle_confirmation_transaction_bad_sequence_number() {
    // TODO: refactor this test to be less magic:
    // * Create an explicit state within an authority, by passing objects.
    // * Create an explicit transfer, and execute it.
    // * Then try to execute it again.

    let (sender, sender_key) = get_key_pair();
    let object_id: ObjectID = ObjectID::random();
    let recipient = dbg_addr(2);
    let gas_object_id = ObjectID::random();
    let authority_state =
        init_state_with_ids(vec![(sender, object_id), (sender, gas_object_id)]).await;
    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let gas_object = authority_state
        .get_object(&gas_object_id)
        .await
        .unwrap()
        .unwrap();

    // Record the old sequence number
    let old_seq_num;
    {
        let old_account = authority_state
            .get_object(&object_id)
            .await
            .unwrap()
            .unwrap();
        old_seq_num = old_account.version();
    }

    let certified_transfer_transaction = init_certified_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
        &authority_state,
    );

    // Increment the sequence number
    {
        let mut sender_object = authority_state
            .get_object(&object_id)
            .await
            .unwrap()
            .unwrap();
        let o = sender_object.data.try_as_move_mut().unwrap();
        let old_contents = o.contents().to_vec();
        // update object contents, which will increment the sequence number
        o.update_contents(old_contents);
        authority_state.insert_genesis_object(sender_object).await;
    }

    // Explanation: providing an old cert that has already need applied
    //              returns a Ok(_) with info about the new object states.
    let response = authority_state
        .handle_confirmation_transaction(ConfirmationTransaction::new(
            certified_transfer_transaction,
        ))
        .await
        .unwrap();
    assert!(response.signed_effects.is_none());

    // Check that the new object is the one recorded.
    let new_object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(old_seq_num.increment(), new_object.version());

    // No recipient object was created.
    assert!(authority_state.get_object(&dbg_object_id(2)).await.is_err());
}

#[tokio::test]
async fn test_handle_confirmation_transaction_receiver_equal_sender() {
    let (address, key) = get_key_pair();
    let object_id: ObjectID = ObjectID::random();
    let gas_object_id = ObjectID::random();
    let authority_state =
        init_state_with_ids(vec![(address, object_id), (address, gas_object_id)]).await;
    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let gas_object = authority_state
        .get_object(&gas_object_id)
        .await
        .unwrap()
        .unwrap();

    let certified_transfer_transaction = init_certified_transfer_transaction(
        address,
        &key,
        address,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
        &authority_state,
    );
    let response = authority_state
        .handle_confirmation_transaction(ConfirmationTransaction::new(
            certified_transfer_transaction,
        ))
        .await
        .unwrap();
    response.signed_effects.unwrap().effects.status.unwrap();
    let account = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(OBJECT_START_VERSION, account.version());

    assert!(authority_state
        .parent(&(object_id, account.version(), account.digest()))
        .await
        .is_some());
}

#[tokio::test]
async fn test_handle_confirmation_transaction_ok() {
    let (sender, sender_key) = get_key_pair();
    let recipient = dbg_addr(2);
    let object_id = ObjectID::random();
    let gas_object_id = ObjectID::random();
    let authority_state =
        init_state_with_ids(vec![(sender, object_id), (sender, gas_object_id)]).await;
    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let gas_object = authority_state
        .get_object(&gas_object_id)
        .await
        .unwrap()
        .unwrap();

    let certified_transfer_transaction = init_certified_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
        &authority_state,
    );

    let old_account = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let mut next_sequence_number = old_account.version();
    next_sequence_number = next_sequence_number.increment();

    let info = authority_state
        .handle_confirmation_transaction(ConfirmationTransaction::new(
            certified_transfer_transaction.clone(),
        ))
        .await
        .unwrap();
    info.signed_effects.unwrap().effects.status.unwrap();
    // Key check: the ownership has changed

    let new_account = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(new_account.owner, recipient);
    assert_eq!(next_sequence_number, new_account.version());
    assert_eq!(None, info.signed_transaction);
    let opt_cert = {
        let refx = authority_state
            .parent(&(object_id, new_account.version(), new_account.digest()))
            .await
            .unwrap();
        authority_state.read_certificate(&refx).await.unwrap()
    };
    if let Some(certified_transaction) = opt_cert {
        // valid since our test authority should not update its certificate set
        compare_certified_transactions(&certified_transaction, &certified_transfer_transaction);
    } else {
        panic!("parent certificate not avaailable from the authority!");
    }

    // Check locks are set and archived correctly
    assert!(authority_state
        .get_transaction_lock(&(object_id, 0.into(), old_account.digest()))
        .await
        .is_err());
    assert!(authority_state
        .get_transaction_lock(&(object_id, 1.into(), new_account.digest()))
        .await
        .expect("Exists")
        .is_none());

    // Check that all the parents are returned.
    assert_eq!(
        authority_state
            .get_parent_iterator(object_id, None)
            .await
            .unwrap()
            .count(),
        2
    );
}

#[tokio::test]
async fn test_handle_confirmation_transaction_idempotent() {
    let (sender, sender_key) = get_key_pair();
    let recipient = dbg_addr(2);
    let object_id = ObjectID::random();
    let gas_object_id = ObjectID::random();
    let authority_state =
        init_state_with_ids(vec![(sender, object_id), (sender, gas_object_id)]).await;
    let object = authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
    let gas_object = authority_state
        .get_object(&gas_object_id)
        .await
        .unwrap()
        .unwrap();

    let certified_transfer_transaction = init_certified_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        object.compute_object_reference(),
        gas_object.compute_object_reference(),
        &authority_state,
    );

    let info = authority_state
        .handle_confirmation_transaction(ConfirmationTransaction::new(
            certified_transfer_transaction.clone(),
        ))
        .await
        .unwrap();
    assert!(info.signed_effects.as_ref().unwrap().effects.status.is_ok());

    let info2 = authority_state
        .handle_confirmation_transaction(ConfirmationTransaction::new(
            certified_transfer_transaction.clone(),
        ))
        .await
        .unwrap();
    assert!(info2
        .signed_effects
        .as_ref()
        .unwrap()
        .effects
        .status
        .is_ok());

    // this is valid because we're checking the authority state does not change the certificate
    compare_transaction_info_responses(&info, &info2);

    // Now check the transaction info request is also the same
    let info3 = authority_state
        .handle_transaction_info_request(TransactionInfoRequest {
            transaction_digest: *certified_transfer_transaction.digest(),
        })
        .await
        .unwrap();

    compare_transaction_info_responses(&info, &info3);
}

#[tokio::test]
async fn test_move_call_mutable_object_not_mutated() {
    let (sender, sender_key) = get_key_pair();
    let gas_object_id = ObjectID::random();
    let authority_state = init_state_with_ids(vec![(sender, gas_object_id)]).await;

    let effects = create_move_object(&authority_state, &gas_object_id, &sender, &sender_key)
        .await
        .unwrap();
    assert!(effects.status.is_ok());
    assert_eq!((effects.created.len(), effects.mutated.len()), (1, 1));
    let (new_object_id1, seq1, _) = effects.created[0].0;

    let effects = create_move_object(&authority_state, &gas_object_id, &sender, &sender_key)
        .await
        .unwrap();
    assert!(effects.status.is_ok());
    assert_eq!((effects.created.len(), effects.mutated.len()), (1, 1));
    let (new_object_id2, seq2, _) = effects.created[0].0;

    let effects = call_framework_code(
        &authority_state,
        &gas_object_id,
        &sender,
        &sender_key,
        "ObjectBasics",
        "update",
        vec![],
        vec![
            TestCallArg::Object(new_object_id1),
            TestCallArg::Object(new_object_id2),
        ],
    )
    .await
    .unwrap();
    assert!(effects.status.is_ok());
    assert_eq!((effects.created.len(), effects.mutated.len()), (0, 3));
    // Verify that both objects' version increased, even though only one object was updated.
    assert_eq!(
        authority_state
            .get_object(&new_object_id1)
            .await
            .unwrap()
            .unwrap()
            .version(),
        seq1.increment()
    );
    assert_eq!(
        authority_state
            .get_object(&new_object_id2)
            .await
            .unwrap()
            .unwrap()
            .version(),
        seq2.increment()
    );
}

#[tokio::test]
async fn test_move_call_delete() {
    let (sender, sender_key) = get_key_pair();
    let gas_object_id = ObjectID::random();
    let authority_state = init_state_with_ids(vec![(sender, gas_object_id)]).await;

    let effects = create_move_object(&authority_state, &gas_object_id, &sender, &sender_key)
        .await
        .unwrap();
    assert!(effects.status.is_ok());
    assert_eq!((effects.created.len(), effects.mutated.len()), (1, 1));
    let (new_object_id1, _seq1, _) = effects.created[0].0;

    let effects = create_move_object(&authority_state, &gas_object_id, &sender, &sender_key)
        .await
        .unwrap();
    assert!(effects.status.is_ok());
    assert_eq!((effects.created.len(), effects.mutated.len()), (1, 1));
    let (new_object_id2, _seq2, _) = effects.created[0].0;

    let effects = call_framework_code(
        &authority_state,
        &gas_object_id,
        &sender,
        &sender_key,
        "ObjectBasics",
        "update",
        vec![],
        vec![
            TestCallArg::Object(new_object_id1),
            TestCallArg::Object(new_object_id2),
        ],
    )
    .await
    .unwrap();
    assert!(effects.status.is_ok());
    // All mutable objects will appear to be mutated, even if they are not.
    // obj1, obj2 and gas are all mutated here.
    assert_eq!((effects.created.len(), effects.mutated.len()), (0, 3));

    let effects = call_framework_code(
        &authority_state,
        &gas_object_id,
        &sender,
        &sender_key,
        "ObjectBasics",
        "delete",
        vec![],
        vec![TestCallArg::Object(new_object_id1)],
    )
    .await
    .unwrap();
    assert!(effects.status.is_ok());
    assert_eq!((effects.deleted.len(), effects.mutated.len()), (1, 1));
}

#[tokio::test]
async fn test_get_latest_parent_entry() {
    let (sender, sender_key) = get_key_pair();
    let gas_object_id = ObjectID::random();
    let authority_state = init_state_with_ids(vec![(sender, gas_object_id)]).await;

    let effects = create_move_object(&authority_state, &gas_object_id, &sender, &sender_key)
        .await
        .unwrap();
    let (new_object_id1, _seq1, _) = effects.created[0].0;

    let effects = create_move_object(&authority_state, &gas_object_id, &sender, &sender_key)
        .await
        .unwrap();
    let (new_object_id2, _seq2, _) = effects.created[0].0;

    let effects = call_framework_code(
        &authority_state,
        &gas_object_id,
        &sender,
        &sender_key,
        "ObjectBasics",
        "update",
        vec![],
        vec![
            TestCallArg::Object(new_object_id1),
            TestCallArg::Object(new_object_id2),
        ],
    )
    .await
    .unwrap();

    // Check entry for object to be deleted is returned
    let (obj_ref, tx) = authority_state
        .get_latest_parent_entry(new_object_id1)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(obj_ref.0, new_object_id1);
    assert_eq!(obj_ref.1, SequenceNumber::from(2));
    assert_eq!(effects.transaction_digest, tx);

    let effects = call_framework_code(
        &authority_state,
        &gas_object_id,
        &sender,
        &sender_key,
        "ObjectBasics",
        "delete",
        vec![],
        vec![TestCallArg::Object(new_object_id1)],
    )
    .await
    .unwrap();

    // Test get_latest_parent_entry function

    // The very first object returns None
    assert!(authority_state
        .get_latest_parent_entry(ObjectID::ZERO)
        .await
        .unwrap()
        .is_none());

    // The objects just after the gas object also returns None
    let mut x = gas_object_id.to_vec();
    let last_index = x.len() - 1;
    // Prevent overflow
    x[last_index] = u8::MAX - x[last_index];
    let unknown_object_id: ObjectID = x.try_into().unwrap();
    assert!(authority_state
        .get_latest_parent_entry(unknown_object_id)
        .await
        .unwrap()
        .is_none());

    // Check gas object is returned.
    let (obj_ref, tx) = authority_state
        .get_latest_parent_entry(gas_object_id)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(obj_ref.0, gas_object_id);
    assert_eq!(obj_ref.1, SequenceNumber::from(4));
    assert_eq!(effects.transaction_digest, tx);

    // Check entry for deleted object is returned
    let (obj_ref, tx) = authority_state
        .get_latest_parent_entry(new_object_id1)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(obj_ref.0, new_object_id1);
    assert_eq!(obj_ref.1, SequenceNumber::from(3));
    assert_eq!(obj_ref.2, ObjectDigest::OBJECT_DIGEST_DELETED);
    assert_eq!(effects.transaction_digest, tx);
}

#[tokio::test]
async fn test_account_state_ok() {
    let sender = dbg_addr(1);
    let object_id = dbg_object_id(1);

    let authority_state = init_state_with_object_id(sender, object_id).await;
    authority_state
        .get_object(&object_id)
        .await
        .unwrap()
        .unwrap();
}

#[tokio::test]
async fn test_account_state_unknown_account() {
    let sender = dbg_addr(1);
    let unknown_address = dbg_object_id(99);
    let authority_state = init_state_with_object_id(sender, ObjectID::random()).await;
    assert!(authority_state
        .get_object(&unknown_address)
        .await
        .unwrap()
        .is_none());
}

#[tokio::test]
async fn test_authority_persist() {
    let seed = [1u8; 32];
    let (committee, _, authority_key) =
        crate::authority_batch::batch_tests::init_state_parameters_from_rng(
            &mut StdRng::from_seed(seed),
        );

    // Create a random directory to store the DB
    let dir = env::temp_dir();
    let path = dir.join(format!("DB_{:?}", ObjectID::random()));
    fs::create_dir(&path).unwrap();

    // Create an authority
    let store = Arc::new(AuthorityStore::open(&path, None));
    let authority =
        crate::authority_batch::batch_tests::init_state(committee, authority_key, store).await;

    // Create an object
    let recipient = dbg_addr(2);
    let object_id = ObjectID::random();
    let obj = Object::with_id_owner_for_testing(object_id, recipient);

    // Store an object
    authority.insert_genesis_object(obj).await;

    // Close the authority
    drop(authority);

    // Reopen the same authority with the same path
    let seed = [1u8; 32];
    let (committee, _, authority_key) =
        crate::authority_batch::batch_tests::init_state_parameters_from_rng(
            &mut StdRng::from_seed(seed),
        );
    let store = Arc::new(AuthorityStore::open(&path, None));
    let authority2 =
        crate::authority_batch::batch_tests::init_state(committee, authority_key, store).await;
    let obj2 = authority2.get_object(&object_id).await.unwrap().unwrap();

    // Check the object is present
    assert_eq!(obj2.id(), object_id);
    assert_eq!(obj2.owner, recipient);
}

#[tokio::test]
async fn test_idempotent_reversed_confirmation() {
    // In this test we exercise the case where an authority first receive the certificate,
    // and then receive the raw transaction latter. We should still ensure idempotent
    // response and be able to get back the same result.
    let recipient = dbg_addr(2);
    let (sender, sender_key) = get_key_pair();

    let object = Object::with_owner_for_testing(sender);
    let object_ref = object.compute_object_reference();
    let gas_object = Object::with_owner_for_testing(sender);
    let gas_object_ref = gas_object.compute_object_reference();
    let authority_state = init_state_with_objects([object, gas_object]).await;

    let certified_transfer_transaction = init_certified_transfer_transaction(
        sender,
        &sender_key,
        recipient,
        object_ref,
        gas_object_ref,
        &authority_state,
    );
    let result1 = authority_state
        .handle_confirmation_transaction(ConfirmationTransaction::new(
            certified_transfer_transaction.clone(),
        ))
        .await;
    assert!(result1.is_ok());
    let result2 = authority_state
        .handle_transaction(certified_transfer_transaction.to_transaction())
        .await;
    assert!(result2.is_ok());
    assert_eq!(
        result1.unwrap().signed_effects.unwrap().effects,
        result2.unwrap().signed_effects.unwrap().effects
    );
}

#[tokio::test]
async fn test_genesis_sui_sysmtem_state_object() {
    // This test verifies that we can read the genesis SuiSystemState object.
    // And its Move layout matches the definition in Rust (so that we can deserialize it).
    let authority_state = init_state().await;
    let sui_system_object = authority_state
        .get_object(&SUI_SYSTEM_STATE_OBJECT_ID)
        .await
        .unwrap()
        .unwrap();
    let move_object = sui_system_object.data.try_as_move().unwrap();
    let _sui_system_state = bcs::from_bytes::<SuiSystemState>(move_object.contents()).unwrap();
    assert_eq!(move_object.type_, SuiSystemState::type_());
}

#[tokio::test]
async fn test_change_epoch_transaction() {
    let authority_state = init_state().await;
    let signed_tx = SignedTransaction::new_change_epoch(
        1,
        100,
        100,
        authority_state.name,
        &*authority_state.secret,
    );
    // Make sure that the raw transaction will never be accepted by the validator.
    assert_eq!(
        authority_state
            .handle_transaction(signed_tx.clone().to_transaction())
            .await
            .unwrap_err(),
        SuiError::InvalidSystemTransaction
    );
    let committee = authority_state.committee.load();
    let mut builder =
        SignatureAggregator::try_new(signed_tx.clone().to_transaction(), &committee).unwrap();
    let certificate = builder
        .append(
            signed_tx.auth_sign_info.authority,
            signed_tx.auth_sign_info.signature,
        )
        .unwrap()
        .unwrap();
    let result = authority_state
        .handle_confirmation_transaction(ConfirmationTransaction::new(certificate))
        .await
        .unwrap();
    assert!(result.signed_effects.unwrap().effects.status.is_ok());
    let sui_system_object = authority_state.get_sui_system_state_object().await.unwrap();
    assert_eq!(sui_system_object.epoch, 1);
}

// helpers

#[cfg(test)]
fn init_state_parameters() -> (Committee, SuiAddress, KeyPair, Arc<AuthorityStore>) {
    let (authority_address, authority_key) = get_key_pair();
    let mut authorities = BTreeMap::new();
    authorities.insert(
        /* address */ *authority_key.public_key_bytes(),
        /* voting right */ 1,
    );
    let committee = Committee::new(0, authorities);

    // Create a random directory to store the DB

    let dir = env::temp_dir();
    let path = dir.join(format!("DB_{:?}", ObjectID::random()));
    fs::create_dir(&path).unwrap();

    let store = Arc::new(AuthorityStore::open(path, None));
    (committee, authority_address, authority_key, store)
}

#[cfg(test)]
pub async fn init_state() -> AuthorityState {
    let (committee, _, authority_key, store) = init_state_parameters();
    AuthorityState::new(
        committee,
        *authority_key.public_key_bytes(),
        Arc::pin(authority_key),
        store,
        None,
        None,
        &sui_config::genesis::Genesis::get_default_genesis(),
        false,
    )
    .await
}

#[cfg(test)]
pub async fn init_state_with_ids<I: IntoIterator<Item = (SuiAddress, ObjectID)>>(
    objects: I,
) -> AuthorityState {
    let state = init_state().await;
    for (address, object_id) in objects {
        let obj = Object::with_id_owner_for_testing(object_id, address);
        state.insert_genesis_object(obj).await;
    }
    state
}

pub async fn init_state_with_objects<I: IntoIterator<Item = Object>>(objects: I) -> AuthorityState {
    let state = init_state().await;
    for o in objects {
        state.insert_genesis_object(o).await;
    }
    state
}

#[cfg(test)]
pub async fn init_state_with_object_id(address: SuiAddress, object: ObjectID) -> AuthorityState {
    init_state_with_ids(std::iter::once((address, object))).await
}

#[cfg(test)]
pub fn init_transfer_transaction(
    sender: SuiAddress,
    secret: &KeyPair,
    recipient: SuiAddress,
    object_ref: ObjectRef,
    gas_object_ref: ObjectRef,
) -> Transaction {
    let data = TransactionData::new_transfer(recipient, object_ref, sender, gas_object_ref, 10000);
    let signature = Signature::new(&data, secret);
    Transaction::new(data, signature)
}

#[cfg(test)]
fn init_certified_transfer_transaction(
    sender: SuiAddress,
    secret: &KeyPair,
    recipient: SuiAddress,
    object_ref: ObjectRef,
    gas_object_ref: ObjectRef,
    authority_state: &AuthorityState,
) -> CertifiedTransaction {
    let transfer_transaction =
        init_transfer_transaction(sender, secret, recipient, object_ref, gas_object_ref);
    let vote = SignedTransaction::new(
        0,
        transfer_transaction.clone(),
        authority_state.name,
        &*authority_state.secret,
    );
    let committee = authority_state.committee.load();
    let mut builder = SignatureAggregator::try_new(transfer_transaction, &committee).unwrap();
    builder
        .append(vote.auth_sign_info.authority, vote.auth_sign_info.signature)
        .unwrap()
        .unwrap()
}

pub async fn call_move(
    authority: &AuthorityState,
    gas_object_id: &ObjectID,
    sender: &SuiAddress,
    sender_key: &KeyPair,
    package: &ObjectRef,
    module: &'_ str,
    function: &'_ str,
    type_args: Vec<TypeTag>,
    test_args: Vec<TestCallArg>,
) -> SuiResult<TransactionEffects> {
    let gas_object = authority.get_object(gas_object_id).await.unwrap();
    let gas_object_ref = gas_object.unwrap().compute_object_reference();
    let mut args = vec![];
    for arg in test_args.into_iter() {
        args.push(arg.to_call_arg(authority).await);
    }
    let data = TransactionData::new_move_call(
        *sender,
        *package,
        Identifier::new(module).unwrap(),
        Identifier::new(function).unwrap(),
        type_args,
        gas_object_ref,
        args,
        MAX_GAS,
    );

    let signature = Signature::new(&data, sender_key);
    let transaction = Transaction::new(data, signature);

    let response = send_and_confirm_transaction(authority, transaction).await?;
    Ok(response.signed_effects.unwrap().effects)
}

async fn call_framework_code(
    authority: &AuthorityState,
    gas_object_id: &ObjectID,
    sender: &SuiAddress,
    sender_key: &KeyPair,
    module: &'_ str,
    function: &'_ str,
    type_args: Vec<TypeTag>,
    args: Vec<TestCallArg>,
) -> SuiResult<TransactionEffects> {
    let package_object_ref = authority.get_framework_object_ref().await?;

    call_move(
        authority,
        gas_object_id,
        sender,
        sender_key,
        &package_object_ref,
        module,
        function,
        type_args,
        args,
    )
    .await
}

pub async fn create_move_object(
    authority: &AuthorityState,
    gas_object_id: &ObjectID,
    sender: &SuiAddress,
    sender_key: &KeyPair,
) -> SuiResult<TransactionEffects> {
    call_framework_code(
        authority,
        gas_object_id,
        sender,
        sender_key,
        "ObjectBasics",
        "create",
        vec![],
        vec![TestCallArg::U64(16), TestCallArg::Address(*sender)],
    )
    .await
}

#[tokio::test]
async fn shared_object() {
    let (sender, keypair) = get_key_pair();

    // Initialize an authority with a (owned) gas object and a shared object.
    let gas_object_id = ObjectID::random();
    let gas_object = Object::with_id_owner_for_testing(gas_object_id, sender);
    let gas_object_ref = gas_object.compute_object_reference();

    let shared_object_id = ObjectID::random();
    let shared_object = {
        use sui_types::gas_coin::GasCoin;
        use sui_types::object::MoveObject;

        let content = GasCoin::new(shared_object_id, OBJECT_START_VERSION, 10);
        let obj = MoveObject::new(/* type */ GasCoin::type_(), content.to_bcs_bytes());
        Object::new_move(obj, Owner::Shared, TransactionDigest::genesis())
    };

    let authority = init_state_with_objects(vec![gas_object, shared_object]).await;

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
        gas_object_ref,
        /* args */
        vec![
            CallArg::SharedObject(shared_object_id),
            CallArg::Pure(16u64.to_le_bytes().to_vec()),
            CallArg::Pure(bcs::to_bytes(&AccountAddress::from(sender)).unwrap()),
        ],
        MAX_GAS,
    );
    let signature = Signature::new(&data, &keypair);
    let transaction = Transaction::new(data, signature);
    let transaction_digest = *transaction.digest();

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
    let confirmation_transaction = ConfirmationTransaction::new(certificate.clone());

    // Sending the certificate now fails since it was not sequenced.
    let result = authority
        .handle_confirmation_transaction(confirmation_transaction.clone())
        .await;
    assert!(matches!(result, Err(SuiError::LockErrors { .. })));

    // Sequence the certificate to assign a sequence number to the shared object.
    authority
        .handle_consensus_transaction(
            /* last_consensus_index */ ExecutionIndices::default(),
            ConsensusTransaction::UserTransaction(Box::new(certificate)),
        )
        .await
        .unwrap();

    let shared_object_version = authority
        .db()
        .sequenced(&transaction_digest, [shared_object_id].iter())
        .unwrap()[0]
        .unwrap();
    assert_eq!(shared_object_version, OBJECT_START_VERSION);

    // Finally process the certificate and execute the contract. Ensure that the
    // shared object lock is cleaned up and that its sequence number increased.
    authority
        .handle_confirmation_transaction(confirmation_transaction)
        .await
        .unwrap();

    let shared_object_lock = authority
        .db()
        .sequenced(&transaction_digest, [shared_object_id].iter())
        .unwrap()[0];
    assert!(shared_object_lock.is_none());

    let shared_object_version = authority
        .get_object(&shared_object_id)
        .await
        .unwrap()
        .unwrap()
        .version();
    assert_eq!(shared_object_version, SequenceNumber::from(2));
}
