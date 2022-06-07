/**
 * Module dependencies.
 */

var validate = require('customs');
var assert = require('assert');

/**
 * Validate an object against
 * the model. If a property has not
 * been set (e.g. undefined), it
 * will be seen as undefined.
 *
 * @param {Object} record
 * @api public
 */

module.exports.validate = function(record) {

  assert('object' == typeof record, 'Record should be an object');

  var result = {};

  Object.keys(this._schema).forEach(function(key) {

    var modelProp = this._schema[key];
    var recordProp = record[key];

    assert(recordProp, 'Property should exist on the record');
    assert(modelProp, 'Property should exist on the model');

    if (!modelProp.type) {
      return result[key] = recordProp == undefined ? undefined : true;
    }
    if (undefined === typeof recordProp) return result[key] = undefined;
    if (modelProp.type != typeof recordProp) return result[key] = false;
    result[key] = true;

  }.bind(this));

  this.emit('validated', result);
}

/**
 * Check if all required properties from
 * the model are present in the record.
 *
 * @param {Object} record
 * @api public
 */

module.exports.allAccountedFor = function(record) {

  assert('object' == typeof record, 'Record should be an object');

  var value = Object.keys(this._schema).every(function(key) {

    var modelProp = this._schema[key];
    var recordProp = record[key];

    if (!modelProp) return true;
    if (!modelProp.required) return true;
    if (recordProp) return true;
    return false;

  }.bind(this));

  this.emit('allAccountedFor', value);
};
