'use strict';

var trunc = require('../../common/var/trunc'),
    cloneDate = require('./cloneDate'),
    advanceDate = require('./advanceDate');

function getTimeDistanceForUnit(d1, d2, unit) {
  var fwd = d2 > d1, num, tmp;
  if (!fwd) {
    tmp = d2;
    d2  = d1;
    d1  = tmp;
  }
  num = d2 - d1;
  if (unit.multiplier > 1) {
    num = trunc(num / unit.multiplier);
  }
  // For higher order with potential ambiguity, use the numeric calculation
  // as a starting point, then iterate until we pass the target date. Decrement
  // starting point by 1 to prevent overshooting the date due to inconsistencies
  // in ambiguous units numerically. For example, calculating the number of days
  // from the beginning of the year to August 5th at 11:59:59 by doing a simple
  // d2 - d1 will produce different results depending on whether or not a
  // timezone shift was encountered due to DST, however that should not have an
  // effect on our calculation here, so subtract by 1 to ensure that the
  // starting point has not already overshot our target date.
  if (unit.ambiguous) {
    d1 = cloneDate(d1);
    if (num) {
      num -= 1;
      advanceDate(d1, unit.name, num);
    }
    while (d1 < d2) {
      advanceDate(d1, unit.name, 1);
      if (d1 > d2) {
        break;
      }
      num += 1;
    }
  }
  return fwd ? -num : num;
}

module.exports = getTimeDistanceForUnit;