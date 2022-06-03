'use strict';

var Sugar = require('sugar-core'),
    trim = require('../common/internal/trim'),
    stringEach = require('./internal/stringEach');

Sugar.String.defineInstance({

  'lines': function(str, eachLineFn) {
    return stringEach(trim(str), /^.*$/gm, eachLineFn);
  }

});

module.exports = Sugar.String.lines;