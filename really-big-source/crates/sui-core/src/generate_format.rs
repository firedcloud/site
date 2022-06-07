// Copyright (c) 2021, Facebook, Inc. and its affiliates
// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
use clap::*;
use move_core_types::{
    language_storage::TypeTag,
    value::{MoveStructLayout, MoveTypeLayout},
};
use pretty_assertions::assert_str_eq;
use serde_reflection::{Registry, Result, Samples, Tracer, TracerConfig};
use signature::Signer;
use std::{fs::File, io::Write};
use sui_types::{
    base_types::{self, ObjectDigest, ObjectID, TransactionDigest, TransactionEffectsDigest},
    batch::UpdateItem,
    crypto::{get_key_pair, AuthoritySignature, Signature},
    error::SuiError,
    messages::{
        CallArg, ExecutionStatus, ObjectInfoRequestKind, SingleTransactionKind, TransactionKind,
    },
    object::{Data, Owner},
};
use typed_store::rocks::TypedStoreError;

fn get_registry() -> Result<Registry> {
    let mut tracer = Tracer::new(TracerConfig::default());
    let mut samples = Samples::new();
    // 1. Record samples for types with custom deserializers.
    // We want to call
    // tracer.trace_value(&mut samples, ...)?;
    // with all the base types contained in messages, especially the ones with custom serializers;
    // or involving generics (see [serde_reflection documentation](https://novifinancial.github.io/serde-reflection/serde_reflection/index.html)).
    let (addr, kp) = get_key_pair();
    let pk = kp.public_key_bytes();
    tracer.trace_value(&mut samples, &addr)?;
    tracer.trace_value(&mut samples, &kp)?;
    tracer.trace_value(&mut samples, &pk)?;

    // We have two signature types: one for Authority Signatures, which don't include the PubKey ...
    let sig: AuthoritySignature = kp.sign(b"hello world");
    tracer.trace_value(&mut samples, &sig)?;
    // ... and the user signature which does
    let sig: Signature = kp.sign(b"hello world");
    tracer.trace_value(&mut samples, &sig)?;

    // ObjectID and SuiAddress are the same length
    let addr_bytes: [u8; ObjectID::LENGTH] = addr.as_ref().try_into().unwrap();
    let oid = ObjectID::from(addr_bytes);
    tracer.trace_value(&mut samples, &oid)?;

    // ObjectDigest and Transaction digest use the `serde_as`speedup for ser/de => trace them
    let od = ObjectDigest::random();
    let td = TransactionDigest::random();
    tracer.trace_value(&mut samples, &od)?;
    tracer.trace_value(&mut samples, &td)?;

    let teff = TransactionEffectsDigest::random();
    tracer.trace_value(&mut samples, &teff)?;

    // 2. Trace the main entry point(s) + every enum separately.
    tracer.trace_type::<SuiError>(&samples)?;
    tracer.trace_type::<Owner>(&samples)?;
    tracer.trace_type::<ExecutionStatus>(&samples)?;
    tracer.trace_type::<CallArg>(&samples)?;
    tracer.trace_type::<Data>(&samples)?;
    tracer.trace_type::<TypeTag>(&samples)?;
    tracer.trace_type::<TypedStoreError>(&samples)?;
    tracer.trace_type::<ObjectInfoRequestKind>(&samples)?;
    tracer.trace_type::<SingleTransactionKind>(&samples)?;
    tracer.trace_type::<TransactionKind>(&samples)?;
    tracer.trace_type::<MoveStructLayout>(&samples)?;
    tracer.trace_type::<MoveTypeLayout>(&samples)?;
    tracer.trace_type::<base_types::SuiAddress>(&samples)?;
    tracer.trace_type::<UpdateItem>(&samples)?;

    tracer.registry()
}

#[derive(Debug, Parser, Clone, Copy, ArgEnum)]
enum Action {
    Print,
    Test,
    Record,
}

#[derive(Debug, Parser)]
#[clap(
    name = "Sui format generator",
    about = "Trace serde (de)serialization to generate format descriptions for Sui types"
)]
struct Options {
    #[clap(arg_enum, default_value = "Print", ignore_case = true)]
    action: Action,
}

const FILE_PATH: &str = "sui-core/tests/staged/sui.yaml";

fn main() {
    let options = Options::parse();
    let registry = get_registry().unwrap();
    match options.action {
        Action::Print => {
            let content = serde_yaml::to_string(&registry).unwrap();
            println!("{content}");
        }
        Action::Record => {
            let content = serde_yaml::to_string(&registry).unwrap();
            let mut f = File::create(FILE_PATH).unwrap();
            writeln!(f, "{}", content).unwrap();
        }
        Action::Test => {
            let reference = std::fs::read_to_string(FILE_PATH).unwrap();
            let content = serde_yaml::to_string(&registry).unwrap() + "\n";
            assert_str_eq!(&reference, &content);
        }
    }
}
