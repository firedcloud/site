/**
 * Module dependencies
 */

var debug = require('debug')('dad:persistance');
var parallel = require('foyer');
var assert = require('assert');

/**
 * Persist transactions to the adapters.
 * Called internally by the transaction
 * function. Emits an error if any error
 * is present, else it emits a sync event.
 *
 * @api private
 */

exports._sync = function(method, args) {

  assert('string' == typeof method, 'Method should be a string');
  assert(args, 'Data should not be undefined');

  var supply = generate(this._adapters);
  var self = this;

  // The callback function that gets called when done.

  function cb(err, res) {
    if (err) return self.emit('error', err, res);
    else self.emit('sync', err, res);
  }

  // Create the generator object
  // that keeps track of the adapter
  // state.

  function generate(adapters) {
    if (!(this instanceof generate)) return new generate(adapters);
    this._adapterCount = adapters.length - 1;
    this.next = next.bind(this);
    this._adapters = adapters;
    this._index = 0;
    return this;
  }

  // Get an adapter from ._adapters
  // and pass it the arguments.
  // Returns true if an adapter was
  // called, and false if there are
  // no adapters left.

  function next(args, supply, cb) {
    if (this._index > this._adapterCount) return cb(null, args);
    var fn = this._adapters[this._index][method];
    this._index += 1;
    fn(args, supply, cb)
    return true;
  }

  // Initialize the adapter chain.

  supply.next(args, supply, cb);
};

/**
 * Fetch records through the adapters.
 *
 * @api public
 */

exports.fetch = function(args) {
  args = args || true;
  this._sync('read', args);
};
