'use strict';

var Inflections = require('../var/Inflections');

function getAcronym(str) {
  // istanbul ignore next
  return Inflections.acronyms && Inflections.acronyms.find(str);
}

module.exports = getAcronym;