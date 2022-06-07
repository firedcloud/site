// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// A Bag is a heterogeneous collection of objects with arbitrary types, i.e.
/// the objects in the bag don't need to be of the same type.
/// These objects are not stored in the Bag directly, instead only a reference
/// to their IDs are stored as a proof of ownership. Sui tracks the ownership
/// and is aware that the Bag owns those objects in it. Only the owner of the Bag
/// could mutate the objects in the Bag.
/// Bag is different from the Collection type in that Collection
/// only supports owning objects of the same type.
module Sui::Bag {
    use Std::Errors;
    use Std::Option::{Self, Option};
    use Std::Vector::Self;
    use Sui::ID::{Self, ID, VersionedID};
    use Sui::Transfer::{Self, ChildRef};
    use Sui::TxContext::{Self, TxContext};

    // Error codes
    /// When removing an object from the collection, EObjectNotFound
    /// will be triggered if the object is not owned by the collection.
    const EObjectNotFound: u64 = 0;

    /// Adding the same object to the collection twice is not allowed.
    const EObjectDoubleAdd: u64 = 1;

    /// The max capacity set for the collection cannot exceed the hard limit
    /// which is DEFAULT_MAX_CAPACITY.
    const EInvalidMaxCapacity: u64 = 2;

    /// Trying to add object to the collection when the collection is
    /// already at its maximum capacity.
    const EMaxCapacityExceeded: u64 = 3;

    // TODO: this is a placeholder number
    const DEFAULT_MAX_CAPACITY: u64 = 65536;

    struct Bag has key {
        id: VersionedID,
        objects: vector<ID>,
        max_capacity: u64,
    }

    /// Create a new Bag and return it.
    public fun new(ctx: &mut TxContext): Bag {
        new_with_max_capacity(ctx, DEFAULT_MAX_CAPACITY)
    }

    /// Create a new Bag with custom size limit and return it.
    public fun new_with_max_capacity(ctx: &mut TxContext, max_capacity: u64): Bag {
        assert!(
            max_capacity <= DEFAULT_MAX_CAPACITY && max_capacity > 0 ,
            Errors::limit_exceeded(EInvalidMaxCapacity)
        );
        Bag {
            id: TxContext::new_id(ctx),
            objects: Vector::empty(),
            max_capacity,
        }
    }

    /// Create a new Bag and transfer it to the signer.
    public(script) fun create(ctx: &mut TxContext) {
        Transfer::transfer(new(ctx), TxContext::sender(ctx))
    }

    /// Returns the size of the Bag.
    public fun size(c: &Bag): u64 {
        Vector::length(&c.objects)
    }

    /// Add an object to the Bag.
    /// Abort if the object is already in the Bag.
    /// If the object was owned by another object, an `old_child_ref` would be around
    /// and need to be consumed as well.
    fun add_impl<T: key + store>(c: &mut Bag, object: T, old_child_ref: Option<ChildRef<T>>) {
        assert!(
            size(c) + 1 <= c.max_capacity,
            Errors::limit_exceeded(EMaxCapacityExceeded)
        );
        let id = ID::id(&object);
        if (contains(c, id)) {
            abort EObjectDoubleAdd
        };
        Vector::push_back(&mut c.objects, *id);
        Transfer::transfer_to_object_unsafe(object, old_child_ref, c);
    }

    /// Add a new object to the Bag.
    /// Abort if the object is already in the Bag.
    public fun add<T: key + store>(c: &mut Bag, object: T) {
        add_impl(c, object, Option::none())
    }

    /// Transfer a object that was owned by another object to the bag.
    /// Since the object is a child object of another object, an `old_child_ref`
    /// is around and needs to be consumed.
    public fun add_child_object<T: key + store>(c: &mut Bag, object: T, old_child_ref: ChildRef<T>) {
        add_impl(c, object, Option::some(old_child_ref))
    }

    /// Check whether the Bag contains a specific object,
    /// identified by the object id in bytes.
    public fun contains(c: &Bag, id: &ID): bool {
        Option::is_some(&find(c, id))
    }

    /// Remove and return the object from the Bag.
    /// Abort if the object is not found.
    public fun remove<T: key + store>(c: &mut Bag, object: T): T {
        let idx = find(c, ID::id(&object));
        if (Option::is_none(&idx)) {
            abort EObjectNotFound
        };
        Vector::remove(&mut c.objects, *Option::borrow(&idx));
        object
    }

    /// Remove the object from the Bag, and then transfer it to the signer.
    public(script) fun remove_and_take<T: key + store>(c: &mut Bag, object: T, ctx: &mut TxContext) {
        let object = remove(c, object);
        Transfer::transfer(object, TxContext::sender(ctx));
    }

    /// Transfer the entire Bag to `recipient`.
    public(script) fun transfer_(c: Bag, recipient: address) {
        Transfer::transfer(c, recipient)
    }

    /// Transfer the entire Bag to `recipient`.
    public fun transfer(c: Bag, recipient: address) {
        Transfer::transfer(c, recipient)
    }

    public fun transfer_to_object_id(
        obj: Bag,
        owner_id: VersionedID,
    ): (VersionedID, ChildRef<Bag>) {
        Transfer::transfer_to_object_id(obj, owner_id)
    }

    /// Look for the object identified by `id_bytes` in the Bag.
    /// Returns the index if found, none if not found.
    fun find(c: &Bag, id: &ID): Option<u64> {
        let i = 0;
        let len = size(c);
        while (i < len) {
            if (Vector::borrow(&c.objects, i) == id) {
                return Option::some(i)
            };
            i = i + 1;
        };
        return Option::none()
    }
}
