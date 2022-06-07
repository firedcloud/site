'use strict';

var Sugar = require('sugar-core'),
    dateRelative = require('./internal/dateRelative');

Sugar.Date.defineInstance({

  'relative': function(date, localeCode, relativeFn) {
    return dateRelative(date, null, localeCode, relativeFn);
  }

});

module.exports = Sugar.Date.relative;