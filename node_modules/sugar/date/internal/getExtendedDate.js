'use strict';

var MINUTES = require('../var/MINUTES'),
    ABBREVIATED_YEAR_REG = require('../var/ABBREVIATED_YEAR_REG'),
    LocaleHelpers = require('../var/LocaleHelpers'),
    DateUnitIndexes = require('../var/DateUnitIndexes'),
    _utc = require('../../common/var/_utc'),
    trunc = require('../../common/var/trunc'),
    forEach = require('../../common/internal/forEach'),
    tzOffset = require('./tzOffset'),
    isDefined = require('../../common/internal/isDefined'),
    resetTime = require('./resetTime'),
    getNewDate = require('./getNewDate'),
    updateDate = require('./updateDate'),
    setWeekday = require('./setWeekday'),
    simpleMerge = require('../../common/internal/simpleMerge'),
    advanceDate = require('./advanceDate'),
    isUndefined = require('../../common/internal/isUndefined'),
    classChecks = require('../../common/var/classChecks'),
    dateIsValid = require('./dateIsValid'),
    simpleClone = require('../../common/internal/simpleClone'),
    isObjectType = require('../../common/internal/isObjectType'),
    moveToEndOfUnit = require('./moveToEndOfUnit'),
    deleteDateParam = require('./deleteDateParam'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases'),
    moveToBeginningOfUnit = require('./moveToBeginningOfUnit'),
    iterateOverDateParams = require('./iterateOverDateParams'),
    getYearFromAbbreviation = require('./getYearFromAbbreviation'),
    iterateOverHigherDateParams = require('./iterateOverHigherDateParams');

var isNumber = classChecks.isNumber,
    isString = classChecks.isString,
    isDate = classChecks.isDate,
    getOwn = coreUtilityAliases.getOwn,
    English = LocaleHelpers.English,
    localeManager = LocaleHelpers.localeManager,
    DAY_INDEX = DateUnitIndexes.DAY_INDEX,
    WEEK_INDEX = DateUnitIndexes.WEEK_INDEX,
    MONTH_INDEX = DateUnitIndexes.MONTH_INDEX,
    YEAR_INDEX = DateUnitIndexes.YEAR_INDEX;

function getExtendedDate(contextDate, d, opt, forceClone) {

  // Locals
  var date, set, loc, afterCallbacks, relative, weekdayDir;

  // Options
  var optPrefer, optLocale, optFromUTC, optSetUTC, optParams, optClone;

  afterCallbacks = [];

  setupOptions(opt);

  function setupOptions(opt) {
    opt = isString(opt) ? { locale: opt } : opt || {};
    optPrefer  = +!!getOwn(opt, 'future') - +!!getOwn(opt, 'past');
    optLocale  = getOwn(opt, 'locale');
    optFromUTC = getOwn(opt, 'fromUTC');
    optSetUTC  = getOwn(opt, 'setUTC');
    optParams  = getOwn(opt, 'params');
    optClone   = getOwn(opt, 'clone');
  }

  function parseFormatValues(match, dif) {
    var set = optParams || {};
    forEach(dif.to, function(param, i) {
      var str = match[i + 1], val;
      if (!str) return;

      val = parseIrregular(str, param);

      if (isUndefined(val)) {
        val = loc.parseValue(str, param);
      }

      set[param] = val;
    });
    return set;
  }

  function parseIrregular(str, param) {
    if (param === 'utc') {
      return 1;
    } else if (param === 'year') {
      var match = str.match(ABBREVIATED_YEAR_REG);
      if (match) {
        return getYearFromAbbreviation(match[1], date, optPrefer);
      }
    }
  }

  // Force the UTC flags to be true if the source date
  // date is UTC, as they will be overwritten later.
  function cloneDateByFlag(d, clone) {
    if (_utc(d) && !isDefined(optFromUTC)) {
      optFromUTC = true;
    }
    if (_utc(d) && !isDefined(optSetUTC)) {
      optSetUTC = true;
    }
    if (clone) {
      d = new Date(d.getTime());
    }
    return d;
  }

  function afterDateSet(fn) {
    afterCallbacks.push(fn);
  }

  function fireCallbacks() {
    forEach(afterCallbacks, function(fn) {
      fn.call();
    });
  }

  function parseStringDate(str) {

    str = str.toLowerCase();

    // The act of getting the locale will initialize
    // if it is missing and add the required formats.
    loc = localeManager.get(optLocale);

    for (var i = 0, dif, match; dif = loc.compiledFormats[i]; i++) {
      match = str.match(dif.reg);
      if (match) {

        // Note that caching the format will modify the compiledFormats array
        // which is not a good idea to do inside its for loop, however we
        // know at this point that we have a matched format and that we will
        // break out below, so simpler to do it here.
        loc.cacheFormat(dif, i);

        set = parseFormatValues(match, dif);

        if (isDefined(set.timestamp)) {
          date.setTime(set.timestamp);
          break;
        }

        if (isDefined(set.ampm)) {
          handleAmpm(set.ampm);
        }

        if (set.utc || isDefined(set.tzHour)) {
          handleTimezoneOffset(set.tzHour, set.tzMinute);
        }

        if (isDefined(set.shift) && isUndefined(set.unit)) {
          // "next january", "next monday", etc
          handleUnitlessShift();
        }

        if (isDefined(set.num) && isUndefined(set.unit)) {
          // "the second of January", etc
          handleUnitlessNum(set.num);
        }

        if (set.midday) {
          // "noon" and "midnight"
          handleMidday(set.midday);
        }

        if (isDefined(set.day)) {
          // Relative day localizations such as "today" and "tomorrow".
          handleRelativeDay(set.day);
        }

        if (isDefined(set.unit)) {
          // "3 days ago", etc
          handleRelativeUnit(set.unit);
        }

        if (set.edge) {
          // "the end of January", etc
          handleEdge(set.edge, set);
        }

        break;
      }
    }

    if (!set) {
      // TODO: remove in next major version
      // Fall back to native parsing
      date = new Date(str);
      if (optFromUTC && dateIsValid(date)) {
        // Falling back to system date here which cannot be parsed as UTC,
        // so if we're forcing UTC then simply add the offset.
        date.setTime(date.getTime() + (tzOffset(date) * MINUTES));
      }
    } else if (relative) {
      updateDate(date, set, false, 1);
    } else {
      updateDate(date, set, true, 0, optPrefer, weekdayDir, contextDate);
    }
    fireCallbacks();
    return date;
  }

  function handleAmpm(ampm) {
    if (ampm === 1 && set.hour < 12) {
      // If the time is 1pm-11pm advance the time by 12 hours.
      set.hour += 12;
    } else if (ampm === 0 && set.hour === 12) {
      // If it is 12:00am then set the hour to 0.
      set.hour = 0;
    }
  }

  function handleTimezoneOffset(tzHour, tzMinute) {
    // Adjust for timezone offset
    _utc(date, true);

    // Sign is parsed as part of the hour, so flip
    // the minutes if it's negative.

    if (tzHour < 0) {
      tzMinute *= -1;
    }

    var offset = tzHour * 60 + (tzMinute || 0);
    if (offset) {
      set.minute = (set.minute || 0) - offset;
    }
  }

  function handleUnitlessShift() {
    if (isDefined(set.month)) {
      // "next January"
      set.unit = YEAR_INDEX;
    } else if (isDefined(set.weekday)) {
      // "next Monday"
      set.unit = WEEK_INDEX;
    }
  }

  function handleUnitlessNum(num) {
    if (isDefined(set.weekday)) {
      // "The second Tuesday of March"
      setOrdinalWeekday(num);
    } else if (isDefined(set.month)) {
      // "The second of March"
      set.date = set.num;
    }
  }

  function handleMidday(hour) {
    set.hour = hour % 24;
    if (hour > 23) {
      // If the date has hours past 24, we need to prevent it from traversing
      // into a new day as that would make it being part of a new week in
      // ambiguous dates such as "Monday".
      afterDateSet(function() {
        advanceDate(date, 'date', trunc(hour / 24));
      });
    }
  }

  function handleRelativeDay() {
    resetTime(date);
    if (isUndefined(set.unit)) {
      set.unit = DAY_INDEX;
      set.num  = set.day;
      delete set.day;
    }
  }

  function handleRelativeUnit(unitIndex) {
    var num;

    if (isDefined(set.num)) {
      num = set.num;
    } else if (isDefined(set.edge) && isUndefined(set.shift)) {
      num = 0;
    } else {
      num = 1;
    }

    // If a weekday is defined, there are 3 possible formats being applied:
    //
    // 1. "the day after monday": unit is days
    // 2. "next monday": short for "next week monday", unit is weeks
    // 3. "the 2nd monday of next month": unit is months
    //
    // In the first case, we need to set the weekday up front, as the day is
    // relative to it. The second case also needs to be handled up front for
    // formats like "next monday at midnight" which will have its weekday reset
    // if not set up front. The last case will set up the params necessary to
    // shift the weekday and allow separateAbsoluteUnits below to handle setting
    // it after the date has been shifted.
    if(isDefined(set.weekday)) {
      if(unitIndex === MONTH_INDEX) {
        setOrdinalWeekday(num);
        num = 1;
      } else {
        updateDate(date, { weekday: set.weekday }, true);
        delete set.weekday;
      }
    }

    if (set.half) {
      // Allow localized "half" as a standalone colloquialism. Purposely avoiding
      // the locale number system to reduce complexity. The units "month" and
      // "week" are purposely excluded in the English date formats below, as
      // "half a week" and "half a month" are meaningless as exact dates.
      num *= set.half;
    }

    if (isDefined(set.shift)) {
      // Shift and unit, ie "next month", "last week", etc.
      num *= set.shift;
    } else if (set.sign) {
      // Unit and sign, ie "months ago", "weeks from now", etc.
      num *= set.sign;
    }

    if (isDefined(set.day)) {
      // "the day after tomorrow"
      num += set.day;
      delete set.day;
    }

    // Formats like "the 15th of last month" or "6:30pm of next week"
    // contain absolute units in addition to relative ones, so separate
    // them here, remove them from the params, and set up a callback to
    // set them after the relative ones have been set.
    separateAbsoluteUnits(unitIndex);

    // Finally shift the unit.
    set[English.units[unitIndex]] = num;
    relative = true;
  }

  function handleEdge(edge, params) {
    var edgeIndex = params.unit, weekdayOfMonth;
    if (!edgeIndex) {
      // If we have "the end of January", then we need to find the unit index.
      iterateOverHigherDateParams(params, function(unitName, val, unit, i) {
        if (unitName === 'weekday' && isDefined(params.month)) {
          // If both a month and weekday exist, then we have a format like
          // "the last tuesday in November, 2012", where the "last" is still
          // relative to the end of the month, so prevent the unit "weekday"
          // from taking over.
          return;
        }
        edgeIndex = i;
      });
    }
    if (edgeIndex === MONTH_INDEX && isDefined(params.weekday)) {
      // If a weekday in a month exists (as described above),
      // then set it up to be set after the date has been shifted.
      weekdayOfMonth = params.weekday;
      delete params.weekday;
    }
    afterDateSet(function() {
      var stopIndex;
      // "edge" values that are at the very edge are "2" so the beginning of the
      // year is -2 and the end of the year is 2. Conversely, the "last day" is
      // actually 00:00am so it is 1. -1 is reserved but unused for now.
      if (edge < 0) {
        moveToBeginningOfUnit(date, edgeIndex, optLocale);
      } else if (edge > 0) {
        if (edge === 1) {
          stopIndex = DAY_INDEX;
          moveToBeginningOfUnit(date, DAY_INDEX);
        }
        moveToEndOfUnit(date, edgeIndex, optLocale, stopIndex);
      }
      if (isDefined(weekdayOfMonth)) {
        setWeekday(date, weekdayOfMonth, -edge);
        resetTime(date);
      }
    });
    if (edgeIndex === MONTH_INDEX) {
      params.specificity = DAY_INDEX;
    } else {
      params.specificity = edgeIndex - 1;
    }
  }

  function setOrdinalWeekday(num) {
    // If we have "the 2nd Tuesday of June", then pass the "weekdayDir"
    // flag along to updateDate so that the date does not accidentally traverse
    // into the previous month. This needs to be independent of the "prefer"
    // flag because we are only ensuring that the weekday is in the future, not
    // the entire date.
    set.weekday = 7 * (num - 1) + set.weekday;
    set.date = 1;
    weekdayDir = 1;
  }

  function separateAbsoluteUnits(unitIndex) {
    var params;

    iterateOverDateParams(set, function(name, val, unit, i) {
      // If there is a time unit set that is more specific than
      // the matched unit we have a string like "5:30am in 2 minutes",
      // which is meaningless, so invalidate the date...
      if (i >= unitIndex) {
        date.setTime(NaN);
        return false;
      } else if (i < unitIndex) {
        // ...otherwise set the params to set the absolute date
        // as a callback after the relative date has been set.
        params = params || {};
        params[name] = val;
        deleteDateParam(set, name);
      }
    });
    if (params) {
      afterDateSet(function() {
        updateDate(date, params, true, 0, false, weekdayDir);
        if (optParams) {
          simpleMerge(optParams, params);
        }
      });
      if (set.edge) {
        // "the end of March of next year"
        handleEdge(set.edge, params);
        delete set.edge;
      }
    }
  }

  if (contextDate && d) {
    // If a context date is passed ("get" and "unitsFromNow"),
    // then use it as the starting point.
    date = cloneDateByFlag(contextDate, true);
  } else {
    date = getNewDate();
  }

  _utc(date, optFromUTC);

  if (isString(d)) {
    date = parseStringDate(d);
  } else if (isDate(d)) {
    date = cloneDateByFlag(d, optClone || forceClone);
  } else if (isObjectType(d)) {
    set = simpleClone(d);
    updateDate(date, set, true);
  } else if (isNumber(d) || d === null) {
    date.setTime(d);
  }
  // A date created by parsing a string presumes that the format *itself* is
  // UTC, but not that the date, once created, should be manipulated as such. In
  // other words, if you are creating a date object from a server time
  // "2012-11-15T12:00:00Z", in the majority of cases you are using it to create
  // a date that will, after creation, be manipulated as local, so reset the utc
  // flag here unless "setUTC" is also set.
  _utc(date, !!optSetUTC);
  return {
    set: set,
    date: date
  };
}

module.exports = getExtendedDate;