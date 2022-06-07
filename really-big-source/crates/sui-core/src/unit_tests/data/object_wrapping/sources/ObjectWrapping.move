// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module ObjectWrapping::ObjectWrapping {
    use Std::Option::{Self, Option};
    use Sui::Transfer;
    use Sui::TxContext::{Self, TxContext};
    use Sui::ID::{Self, VersionedID};

    struct Child has key, store {
        id: VersionedID,
    }

    struct Parent has key {
        id: VersionedID,
        child: Option<Child>,
    }

    public(script) fun create_child(ctx: &mut TxContext) {
        Transfer::transfer(
            Child {
                id: TxContext::new_id(ctx),
            },
            TxContext::sender(ctx),
        )
    }

    public(script) fun create_parent(child: Child, ctx: &mut TxContext) {
        Transfer::transfer(
            Parent {
                id: TxContext::new_id(ctx),
                child: Option::some(child),
            },
            TxContext::sender(ctx),
        )
    }

    public(script) fun set_child(parent: &mut Parent, child: Child) {
        Option::fill(&mut parent.child, child)
    }

    public(script) fun extract_child(parent: &mut Parent, ctx: &mut TxContext) {
        let child = Option::extract(&mut parent.child);
        Transfer::transfer(
            child,
            TxContext::sender(ctx),
        )
    }

    public(script) fun delete_parent(parent: Parent) {
        let Parent { id: parent_id, child: child_opt } = parent;
        ID::delete(parent_id);
        if (Option::is_some(&child_opt)) {
            let child = Option::extract(&mut child_opt);
            let Child { id: child_id } = child;
            ID::delete(child_id);
        };
        Option::destroy_none(child_opt)
    }
}
