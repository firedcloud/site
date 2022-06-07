/**
 * Module dependencies
 */

var debug = require('debug')('dad:application');
var Emitter = require('events').EventEmitter;
var assert = require('assert');

var transaction = require('./transaction');
var persistance = require('./persistance');
var validation = require('./validation');

/**
 * Expose 'Store'.
 */

exports = module.exports = Store;

/**
 * 'Store' prototype
 */

var store = Store.prototype;

/**
 * Create a new 'Store'.
 *
 * @param {String} name
 * @return {Store}
 * @api public
 */

function Store(name) {
  if (!(this instanceof Store)) return new Store(name);
  this._name = name || '';
  this._transactions = [];
  this._adapters = [];
  this._cidCount = 0;
  this._schema = {};
  this._store = [];
  return this;
};

/**
 * Inherit from `Emitter.prototype`.
 */

Store.prototype.__proto__ = Emitter.prototype;

/**
 * Define the model schema. This
 * defines how our data should
 * look like.
 *
 * @params {Object[]} schema
 * @api public
 */

Object.defineProperty(store, 'schema', {
  set: function(schema) {
    this._schema = schema;
  }
});

/**
 * Define the adapters on the store.
 *
 * @param {Function[]} adapters
 * @api public
 */

Object.defineProperty(store, 'adapters', {
  set: function(adapters) {
    this._adapters = adapters;
  }
});

/**
 * Delegates.
 */

store.customAdd = transaction.customAdd;
store.update = transaction.update;
store.remove = transaction.remove;
store.add = transaction.add;
store.get = transaction.get;

store.baseUrl = persistance.baseUrl;
store.adapter = persistance.adapter;
store.fetch = persistance.fetch;
store._sync = persistance._sync;

store.allAccountedFor = validation.allAccountedFor;
store.validate = validation.validate;
