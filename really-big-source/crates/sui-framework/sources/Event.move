// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module Sui::Event {

    /// Add `t` to the event log of this transaction
    // TODO(https://github.com/MystenLabs/sui/issues/19):
    // restrict to internal types once we can express this in the ability system
    public native fun emit<T: copy + drop>(event: T);
}
