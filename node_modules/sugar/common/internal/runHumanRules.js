'use strict';

var Inflections = require('../var/Inflections');

function runHumanRules(str) {
  // istanbul ignore next
  return Inflections.human && Inflections.human.runRules(str) || str;
}

module.exports = runHumanRules;