'use strict';

var Sugar = require('sugar-core'),
    updateDate = require('./internal/updateDate'),
    collectUpdateDateArguments = require('./internal/collectUpdateDateArguments');

Sugar.Date.defineInstanceWithArguments({

  'set': function(d, args) {
    args = collectUpdateDateArguments(args);
    return updateDate(d, args[0], args[1]);
  }

});

module.exports = Sugar.Date.set;