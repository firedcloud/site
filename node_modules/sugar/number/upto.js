'use strict';

var Sugar = require('sugar-core'),
    Range = require('../range/internal/Range'),
    rangeEvery = require('../range/internal/rangeEvery');

Sugar.Number.defineInstance({

  'upto': function(n, num, step, everyFn) {
    return rangeEvery(new Range(n, num), step, false, everyFn);
  }

});

module.exports = Sugar.Number.upto;