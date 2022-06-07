'use strict';

function getCollationReadyString(str, sortIgnore, sortIgnoreCase) {
  if (sortIgnoreCase) {
    str = str.toLowerCase();
  }
  if (sortIgnore) {
    str = str.replace(sortIgnore, '');
  }
  return str;
}

module.exports = getCollationReadyString;