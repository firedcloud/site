'use strict';

var Sugar = require('sugar-core'),
    assertCallable = require('../../common/internal/assertCallable');

Sugar.Array.defineInstancePolyfill({

  'forEach': function(eachFn) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, context = arguments[1];
    var length = this.length, index = 0;
    assertCallable(eachFn);
    while(index < length) {
      if (index in this) {
        eachFn.call(context, this[index], index, this);
      }
      index++;
    }
  }

});

// This package does not export anything as it is mapping a
// polyfill to Array.prototype which cannot be called statically.