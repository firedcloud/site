'use strict';

var DateUnits = require('../var/DateUnits'),
    DateUnitIndexes = require('../var/DateUnitIndexes'),
    forEach = require('../../common/internal/forEach'),
    createDate = require('./createDate'),
    compareDate = require('./compareDate'),
    advanceDate = require('./advanceDate'),
    moveToEndOfUnit = require('./moveToEndOfUnit'),
    namespaceAliases = require('../../common/var/namespaceAliases'),
    simpleCapitalize = require('../../common/internal/simpleCapitalize'),
    moveToBeginningOfUnit = require('./moveToBeginningOfUnit'),
    defineInstanceSimilar = require('../../common/internal/defineInstanceSimilar'),
    getTimeDistanceForUnit = require('./getTimeDistanceForUnit');

var sugarDate = namespaceAliases.sugarDate,
    HOURS_INDEX = DateUnitIndexes.HOURS_INDEX,
    DAY_INDEX = DateUnitIndexes.DAY_INDEX;

function buildDateUnitMethods() {

  defineInstanceSimilar(sugarDate, DateUnits, function(methods, unit, index) {
    var name = unit.name, caps = simpleCapitalize(name);

    if (index > DAY_INDEX) {
      forEach(['Last','This','Next'], function(shift) {
        methods['is' + shift + caps] = function(d, localeCode) {
          return compareDate(d, shift + ' ' + name, 0, localeCode, { locale: 'en' });
        };
      });
    }
    if (index > HOURS_INDEX) {
      methods['beginningOf' + caps] = function(d, localeCode) {
        return moveToBeginningOfUnit(d, index, localeCode);
      };
      methods['endOf' + caps] = function(d, localeCode) {
        return moveToEndOfUnit(d, index, localeCode);
      };
    }

    methods['add' + caps + 's'] = function(d, num, reset) {
      return advanceDate(d, name, num, reset);
    };

    var since = function(date, d, options) {
      return getTimeDistanceForUnit(date, createDate(d, options, true), unit);
    };
    var until = function(date, d, options) {
      return getTimeDistanceForUnit(createDate(d, options, true), date, unit);
    };

    methods[name + 'sAgo']   = methods[name + 'sUntil']   = until;
    methods[name + 'sSince'] = methods[name + 'sFromNow'] = since;

  });

}

module.exports = buildDateUnitMethods;