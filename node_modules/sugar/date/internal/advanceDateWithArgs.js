'use strict';

var updateDate = require('./updateDate'),
    collectUpdateDateArguments = require('./collectUpdateDateArguments');

function advanceDateWithArgs(d, args, dir) {
  args = collectUpdateDateArguments(args, true);
  return updateDate(d, args[0], args[1], dir);
}

module.exports = advanceDateWithArgs;