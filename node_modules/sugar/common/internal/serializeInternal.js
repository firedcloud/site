'use strict';

var indexOf = require('./indexOf'),
    isRealNaN = require('./isRealNaN'),
    isPrimitive = require('./isPrimitive'),
    classChecks = require('../var/classChecks'),
    isObjectType = require('./isObjectType'),
    coreUtilityAliases = require('../var/coreUtilityAliases'),
    iterateWithCyclicCheck = require('./iterateWithCyclicCheck');

var classToString = coreUtilityAliases.classToString,
    isSerializable = classChecks.isSerializable;

function serializeInternal(obj, refs, stack) {
  var type = typeof obj, sign = '', className, value, ref;

  // Return up front on
  if (1 / obj === -Infinity) {
    sign = '-';
  }

  // Return quickly for primitives to save cycles
  if (isPrimitive(obj, type) && !isRealNaN(obj)) {
    return type + sign + obj;
  }

  className = classToString(obj);

  if (!isSerializable(obj, className)) {
    ref = indexOf(refs, obj);
    if (ref === -1) {
      ref = refs.length;
      refs.push(obj);
    }
    return ref;
  } else if (isObjectType(obj)) {
    value = serializeDeep(obj, refs, stack) + obj.toString();
  } else if (obj.valueOf) {
    value = obj.valueOf();
  }
  return type + className + sign + value;
}

function serializeDeep(obj, refs, stack) {
  var result = '';
  iterateWithCyclicCheck(obj, true, stack, function(key, val, cyc, stack) {
    result += cyc ? 'CYC' : key + serializeInternal(val, refs, stack);
  });
  return result;
}

module.exports = serializeInternal;