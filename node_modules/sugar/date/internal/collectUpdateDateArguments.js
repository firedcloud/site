'use strict';

var classChecks = require('../../common/var/classChecks'),
    simpleClone = require('../../common/internal/simpleClone'),
    isObjectType = require('../../common/internal/isObjectType'),
    getDateParamsFromString = require('./getDateParamsFromString'),
    collectDateParamsFromArguments = require('./collectDateParamsFromArguments');

var isNumber = classChecks.isNumber,
    isString = classChecks.isString;

function collectUpdateDateArguments(args, allowDuration) {
  var arg1 = args[0], arg2 = args[1], params, reset;
  if (allowDuration && isString(arg1)) {
    params = getDateParamsFromString(arg1);
    reset  = arg2;
  } else if (isNumber(arg1) && isNumber(arg2)) {
    params = collectDateParamsFromArguments(args);
  } else {
    params = isObjectType(arg1) ? simpleClone(arg1) : arg1;
    reset  = arg2;
  }
  return [params, reset];
}

module.exports = collectUpdateDateArguments;