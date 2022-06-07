'use strict';

var isUndefined = require('../../common/internal/isUndefined');

function getDateParamsFromString(str) {
  var match, num, params = {};
  match = str.match(/^(-?\d*[\d.]\d*)?\s?(\w+?)s?$/i);
  if (match) {
    if (isUndefined(num)) {
      num = match[1] ? +match[1] : 1;
    }
    params[match[2].toLowerCase()] = num;
  }
  return params;
}

module.exports = getDateParamsFromString;