// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module Sui::EpochRewardRecord {
    use Sui::ID::VersionedID;
    use Sui::Transfer;
    use Sui::TxContext::{Self, TxContext};

    friend Sui::SuiSystem;
    friend Sui::ValidatorSet;

    /// EpochRewardRecord is an immutable record created per epoch per active validator.
    /// Sufficient information is saved in the record so that delegators can claim
    /// delegation rewards from past epochs, and for validators that may no longer be active.
    /// TODO: For now we assume that validators don't charge an extra fee.
    /// Delegation reward is simply proportional to to overall delegation reward ratio
    /// and the delegation amount.
    struct EpochRewardRecord has key {
        id: VersionedID,
        epoch: u64,
        computation_charge: u64,
        total_stake: u64,
        delegator_count: u64,
        validator: address,
    }

    public(friend) fun create(
        epoch: u64,
        computation_charge: u64,
        total_stake: u64,
        delegator_count: u64,
        validator: address,
        ctx: &mut TxContext,
    ) {
        Transfer::share_object(EpochRewardRecord {
            id: TxContext::new_id(ctx),
            epoch,
            computation_charge,
            total_stake,
            delegator_count,
            validator,
        })
    }

    /// Given the delegation amount, calculate the reward, and decrement the `delegator_count`.
    public(friend) fun claim_reward(self: &mut EpochRewardRecord, delegation_amount: u64): u64 {
        self.delegator_count = self.delegator_count - 1;
        // TODO: Once self.delegator_count reaches 0, we should be able to delete this object.
        delegation_amount * self.computation_charge / self.total_stake
    }

    public fun epoch(self: &EpochRewardRecord): u64 {
        self.epoch
    }

    public fun validator(self: &EpochRewardRecord): address {
        self.validator
    }


}
