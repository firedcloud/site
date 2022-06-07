'use strict';

var Sugar = require('sugar-core'),
    isDefined = require('../common/internal/isDefined');

Sugar.Number.defineInstance({

  'times': function(n, indexMapFn) {
    var arr, result;
    for(var i = 0; i < n; i++) {
      result = indexMapFn.call(n, i);
      if (isDefined(result)) {
        if (!arr) {
          arr = [];
        }
        arr.push(result);
      }
    }
    return arr;
  }

});

module.exports = Sugar.Number.times;