'use strict';

var Sugar = require('sugar-core'),
    stringEach = require('./internal/stringEach');

Sugar.String.defineInstance({

  'chars': function(str, search, eachCharFn) {
    return stringEach(str, search, eachCharFn);
  }

});

module.exports = Sugar.String.chars;