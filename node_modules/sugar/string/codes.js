'use strict';

var Sugar = require('sugar-core'),
    stringCodes = require('./internal/stringCodes');

Sugar.String.defineInstance({

  'codes': function(str, eachCodeFn) {
    return stringCodes(str, eachCodeFn);
  }

});

module.exports = Sugar.String.codes;