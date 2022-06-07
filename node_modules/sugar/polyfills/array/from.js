'use strict';

var Sugar = require('sugar-core'),
    trunc = require('../../common/var/trunc'),
    isDefined = require('../../common/internal/isDefined'),
    mathAliases = require('../../common/var/mathAliases'),
    classChecks = require('../../common/var/classChecks'),
    isArrayIndex = require('../../common/internal/isArrayIndex'),
    assertCallable = require('../../common/internal/assertCallable'),
    getCoercedObject = require('../../es6/internal/getCoercedObject'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var max = mathAliases.max,
    isFunction = classChecks.isFunction,
    setProperty = coreUtilityAliases.setProperty;

Sugar.Array.defineStaticPolyfill({

  'from': function(a) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, mapFn = arguments[1], context = arguments[2];
    var len, arr;
    if (isDefined(mapFn)) {
      assertCallable(mapFn);
    }
    a = getCoercedObject(a);
    len = trunc(max(0, a.length || 0));
    if (!isArrayIndex(len)) {
      throw new RangeError('Invalid array length');
    }
    if (isFunction(this)) {
      arr = new this(len);
      arr.length = len;
    } else {
      arr = new Array(len);
    }
    for (var i = 0; i < len; i++) {
      setProperty(arr, i, isDefined(mapFn) ? mapFn.call(context, a[i], i) : a[i], true);
    }
    return arr;
  }

});

// This package does not export anything as it is mapping a
// polyfill to Array.prototype which cannot be called statically.