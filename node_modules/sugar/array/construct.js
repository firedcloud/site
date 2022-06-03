'use strict';

var Sugar = require('sugar-core'),
    coercePositiveInteger = require('../common/internal/coercePositiveInteger');

Sugar.Array.defineStatic({

  'construct': function(n, indexMapFn) {
    n = coercePositiveInteger(n);
    return Array.from(new Array(n), function(el, i) {
      return indexMapFn && indexMapFn(i);
    });
  }

});

module.exports = Sugar.Array.construct;