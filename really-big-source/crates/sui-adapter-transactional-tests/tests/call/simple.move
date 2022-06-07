// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

//# init --addresses Test=0x0 A=0x42

//# publish
module Test::M1 {
    use Sui::ID::VersionedID;
    use Sui::TxContext::{Self, TxContext};
    use Sui::Transfer;
    use Sui::Coin::Coin;

    struct Object has key, store {
        id: VersionedID,
        value: u64,
    }

    fun foo<T: key, T2: drop>(_p1: u64, value1: T, _value2: &Coin<T2>, _p2: u64): T {
        value1
    }

    public(script) fun create(value: u64, recipient: address, ctx: &mut TxContext) {
        Transfer::transfer(
            Object { id: TxContext::new_id(ctx), value },
            recipient
        )
    }
}

//# run Test::M1::create --args 0 @A

//# view-object 105
