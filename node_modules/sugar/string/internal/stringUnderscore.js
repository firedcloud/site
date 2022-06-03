'use strict';

var Inflections = require('../../common/var/Inflections');

function stringUnderscore(str) {
  var areg = Inflections.acronyms && Inflections.acronyms.reg;
  // istanbul ignore if
  if (areg) {
    str = str.replace(areg, function(acronym, index) {
      return (index > 0 ? '_' : '') + acronym.toLowerCase();
    })
  }
  return str
    .replace(/[-\s]+/g, '_')
    .replace(/([A-Z\d]+)([A-Z][a-z])/g,'$1_$2')
    .replace(/([a-z\d])([A-Z])/g,'$1_$2')
    .toLowerCase();
}

module.exports = stringUnderscore;