// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module Sui::Validator {
    use Std::ASCII;
    use Std::Option::{Self, Option};
    use Std::Vector;

    use Sui::Balance::{Self, Balance};
    use Sui::Coin;
    use Sui::SUI::SUI;
    use Sui::Transfer;
    use Sui::TxContext::TxContext;

    friend Sui::Genesis;
    friend Sui::SuiSystem;
    friend Sui::ValidatorSet;

    #[test_only]
    friend Sui::ValidatorTests;
    #[test_only]
    friend Sui::ValidatorSetTests;

    struct ValidatorMetadata has store, drop, copy {
        /// The Sui Address of the validator. This is the sender that created the Validator object,
        /// and also the address to send validator/coins to during withdraws.
        sui_address: address,
        /// The public key bytes corresponding to the private key that the validator
        /// holds to sign transactions. For now, this is the same as AuthorityName.
        pubkey_bytes: vector<u8>,
        /// A unique human-readable name of this validator.
        name: vector<u8>,
        /// The network address of the validator (could also contain extra info such as port, DNS and etc.).
        net_address: vector<u8>,
        /// Total amount of validator stake that would be active in the next epoch.
        /// This only includes validator stake, and does not include delegation.
        next_epoch_stake: u64,
    }

    struct Validator has store {
        /// Summary of the validator.
        metadata: ValidatorMetadata,
        /// The current active stake. This will not change during an epoch. It can only
        /// be updated at the end of epoch.
        stake: Balance<SUI>,
        /// Amount of delegated stake from token holders.
        delegation: u64,
        /// Pending stake deposits. It will be put into `stake` at the end of epoch.
        pending_stake: Option<Balance<SUI>>,
        /// Pending withdraw amount, processed at end of epoch.
        pending_withdraw: u64,
        /// Pending delegation deposits.
        pending_delegation: u64,
        /// Pending delegation withdraws.
        pending_delegation_withdraw: u64,
        /// Number of delegators that is currently delegating token to this validator.
        /// This is used to create EpochRewardRecord, to help track how many delegators
        /// have not yet claimed their reward.
        delegator_count: u64,
        /// Number of new delegators that will become effective in the next epoch.
        pending_delegator_count: u64,
        /// Number of delegators that will withdraw stake at the end of the epoch.
        pending_delegator_withdraw_count: u64,
    }

    public(friend) fun new(
        sui_address: address,
        pubkey_bytes: vector<u8>,
        name: vector<u8>,
        net_address: vector<u8>,
        stake: Balance<SUI>,
    ): Validator {
        assert!(
            // TODO: These constants are arbitrary, will adjust once we know more.
            Vector::length(&net_address) <= 100 && Vector::length(&name) <= 50 && Vector::length(&pubkey_bytes) <= 128,
            0
        );
        // Check that the name is human-readable.
        ASCII::string(copy name);
        Validator {
            metadata: ValidatorMetadata {
                sui_address,
                pubkey_bytes,
                name,
                net_address,
                next_epoch_stake: Balance::value(&stake),
            },
            stake,
            delegation: 0,
            pending_stake: Option::none(),
            pending_withdraw: 0,
            pending_delegation: 0,
            pending_delegation_withdraw: 0,
            delegator_count: 0,
            pending_delegator_count: 0,
            pending_delegator_withdraw_count: 0,
        }
    }

    public(friend) fun destroy(self: Validator, ctx: &mut TxContext) {
        let Validator {
            metadata,
            stake,
            delegation: _,
            pending_stake,
            pending_withdraw,
            pending_delegation: _,
            pending_delegation_withdraw: _,
            delegator_count: _,
            pending_delegator_count: _,
            pending_delegator_withdraw_count: _,
        } = self;

        assert!(pending_withdraw == 0, 0);
        if (Option::is_some(&pending_stake)) {
            // pending_stake can be non-empty as it can contain the gas reward from the last epoch.
            let pending_stake_balance = Option::extract(&mut pending_stake);
            Balance::join(&mut stake, pending_stake_balance);
        };
        Option::destroy_none(pending_stake);
        Transfer::transfer(Coin::from_balance(stake, ctx), metadata.sui_address);
    }

    /// Add stake to an active validator. The new stake is added to the pending_stake field,
    /// which will be processed at the end of epoch.
    public(friend) fun request_add_stake(
        self: &mut Validator,
        new_stake: Balance<SUI>,
    ) {
        let new_stake_value = Balance::value(&new_stake);
        let pending_stake = if (Option::is_some(&self.pending_stake)) {
            let pending_stake = Option::extract(&mut self.pending_stake);
            Balance::join(&mut pending_stake, new_stake);
            pending_stake
        } else {
            new_stake
        };
        Option::fill(&mut self.pending_stake, pending_stake);
        self.metadata.next_epoch_stake = self.metadata.next_epoch_stake + new_stake_value;
    }

    /// Withdraw stake from an active validator. Since it's active, we need
    /// to add it to the pending withdraw amount and process it at the end
    /// of epoch. We also need to make sure there is sufficient amount to withdraw such that the validator's
    /// stake still satisfy the minimum requirement.
    public(friend) fun request_withdraw_stake(
        self: &mut Validator,
        withdraw_amount: u64,
        min_validator_stake: u64,
    ) {
        assert!(self.metadata.next_epoch_stake >= withdraw_amount + min_validator_stake, 0);
        self.pending_withdraw = self.pending_withdraw + withdraw_amount;
        self.metadata.next_epoch_stake = self.metadata.next_epoch_stake - withdraw_amount;
    }

    /// Process pending stake and pending withdraws.
    public(friend) fun adjust_stake(self: &mut Validator, ctx: &mut TxContext) {
        if (Option::is_some(&self.pending_stake)) {
            let pending_stake = Option::extract(&mut self.pending_stake);
            Balance::join(&mut self.stake, pending_stake);
        };
        if (self.pending_withdraw > 0) {
            let coin = Coin::withdraw(&mut self.stake, self.pending_withdraw, ctx);
            Coin::transfer(coin, self.metadata.sui_address);
            self.pending_withdraw = 0;
        };
        assert!(Balance::value(&self.stake) == self.metadata.next_epoch_stake, 0);

        self.delegation = self.delegation + self.pending_delegation - self.pending_delegation_withdraw;
        self.pending_delegation = 0;
        self.pending_delegation_withdraw = 0;

        self.delegator_count = self.delegator_count + self.pending_delegator_count - self.pending_delegator_withdraw_count;
        self.pending_delegator_count = 0;
        self.pending_delegator_withdraw_count = 0;
    }

    public(friend) fun request_add_delegation(self: &mut Validator, delegate_amount: u64) {
        assert!(delegate_amount > 0, 0);
        self.pending_delegation = self.pending_delegation + delegate_amount;
        self.pending_delegator_count = self.pending_delegator_count + 1;
    }

    public(friend) fun request_remove_delegation(self: &mut Validator, delegate_amount: u64) {
        self.pending_delegation_withdraw = self.pending_delegation_withdraw + delegate_amount;
        self.pending_delegator_withdraw_count = self.pending_delegator_withdraw_count + 1;
    }

    public fun metadata(self: &Validator): &ValidatorMetadata {
        &self.metadata
    }

    public fun sui_address(self: &Validator): address {
        self.metadata.sui_address
    }

    public fun stake_amount(self: &Validator): u64 {
        Balance::value(&self.stake)
    }

    public fun delegate_amount(self: &Validator): u64 {
        self.delegation
    }

    public fun delegator_count(self: &Validator): u64 {
        self.delegator_count
    }

    public fun pending_stake_amount(self: &Validator): u64 {
        if (Option::is_some(&self.pending_stake)) {
            Balance::value(Option::borrow(&self.pending_stake))
        } else {
            0
        }
    }

    public fun pending_withdraw(self: &Validator): u64 {
        self.pending_withdraw
    }

    public fun is_duplicate(self: &Validator, other: &Validator): bool {
         self.metadata.sui_address == other.metadata.sui_address
            || self.metadata.name == other.metadata.name
            || self.metadata.net_address == other.metadata.net_address
    }
}
