'use strict';

var Sugar = require('sugar-core'),
    objectForEach = require('../enumerable/internal/objectForEach');

Sugar.Object.defineInstanceAndStatic({

  'forEach': function(obj, eachFn) {
    return objectForEach(obj, eachFn);
  }

});

module.exports = Sugar.Object.forEach;