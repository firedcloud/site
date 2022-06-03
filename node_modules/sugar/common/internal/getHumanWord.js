'use strict';

var Inflections = require('../var/Inflections');

function getHumanWord(str) {
  // istanbul ignore next
  return Inflections.human && Inflections.human.find(str);
}

module.exports = getHumanWord;