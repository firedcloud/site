'use strict';

/**
 * Expose customs
 */

module.exports = exports = customs;

/**
 * Init 'customs'
 *
 *  var validate = require('customs');
 *  validate('string', 'hi');
 *  // -> 'true'
 *
 * @params {String} type
 * @params {Any} target
 * @return {Boolean}
 * @api public
 */

function customs (type, target) {
  switch (type) {

    case 'array':
      if ('[object Array]' == Object.prototype.toString.call(target)){
        return true;
      }
      return false;

    case 'string':
      if ('string' == typeof(target)) {
        return true;
      }
      return false;

    case 'number':
      if ('number' == typeof(target)) {
        return true
      };
      return false;

    case 'boolean':
      if ('boolean' == typeof(target)) {
        return true;
      }
      return false;

    case 'object':
      if ('object' == typeof(target)) {
        return true;
      }
      return false;

    case 'email':
      var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (regex.test(target)) {
        return true;
      }

    default:
      // check and evaluate regex
      if (type instanceof RegExp && type.test(target)) {
        return true;
      }
      return false;
  }
}