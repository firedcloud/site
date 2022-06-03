'use strict';

var Sugar = require('sugar-core'),
    arrayReduce = require('../../es5/internal/arrayReduce');

Sugar.Array.defineInstancePolyfill({

  'reduce': function(reduceFn) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, context = arguments[1];
    return arrayReduce(this, reduceFn, context);
  }

});

// This package does not export anything as it is mapping a
// polyfill to Array.prototype which cannot be called statically.