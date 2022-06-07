/**
 * Module dependencies,
 */

var assert = require('assert');

/**
 * Merge two objects recursively into a new object. 
 *
 * @param {Object} obj1
 * @param {Object} obj2
 * @return {Object}
 * @api public
 */

module.exports = function (obj1, obj2) {
  assert('object' == typeof obj1, 'Obj1 should be an object');
  assert('object' == typeof obj2, 'Obj2 should be an object');
  var tmp = {};
  obj1 = clone(tmp, obj1);
  return clone(obj1, obj2);
}

/**
 * Merge the properties from one object to another object. If duplicate keys
 * exist on the same level, obj2 takes presedence over obj1.
 * 
 * @param {Object} obj1
 * @param {Object} obj2
 * @param {Number} index
 * @return {Object}
 * @api private
 */

function clone(obj1, obj2, index) {
  index = index || 0;
  for (var i in obj2) {
    if ('object' == typeof i) obj1[i] = recursiveMerge(obj1[i], obj2[i], index++);
    else obj1[i] = obj2[i];
  }
  return obj1;
}