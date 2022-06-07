'use strict';

var Sugar = require('sugar-core'),
    stringEach = require('./internal/stringEach');

Sugar.String.defineInstance({

  'forEach': function(str, search, eachFn) {
    return stringEach(str, search, eachFn);
  }

});

module.exports = Sugar.String.forEach;