'use strict';

var map = require('./map'),
    classChecks = require('../var/classChecks'),
    deepGetProperty = require('./deepGetProperty');

var isFunction = classChecks.isFunction,
    isArray = classChecks.isArray;

function mapWithShortcuts(el, f, context, mapArgs) {
  if (!f) {
    return el;
  } else if (f.apply) {
    return f.apply(context, mapArgs);
  } else if (isArray(f)) {
    return map(f, function(m) {
      return mapWithShortcuts(el, m, context, mapArgs);
    });
  } else if (isFunction(el[f])) {
    return el[f].call(el);
  } else {
    return deepGetProperty(el, f, true);
  }
}

module.exports = mapWithShortcuts;