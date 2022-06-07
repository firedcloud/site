'use strict';

var Sugar = require('sugar-core'),
    arrayGroupBy = require('./internal/arrayGroupBy');

Sugar.Array.defineInstance({

  'groupBy': function(arr, map, groupFn) {
    return arrayGroupBy(arr, map, groupFn);
  }

});

module.exports = Sugar.Array.groupBy;