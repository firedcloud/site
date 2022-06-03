'use strict';

var CoreParsingTokens = {
  'yyyy': {
    param: 'year',
    src: '[-−+]?\\d{4,6}'
  },
  'yy': {
    param: 'year',
    src: '\\d{2}'
  },
  'y': {
    param: 'year',
    src: '\\d'
  },
  'ayy': {
    param: 'year',
    src: '\'\\d{2}'
  },
  'MM': {
    param: 'month',
    src: '(?:1[012]|0?[1-9])'
  },
  'dd': {
    param: 'date',
    src: '(?:3[01]|[12][0-9]|0?[1-9])'
  },
  'hh': {
    param: 'hour',
    src: '(?:2[0-4]|[01]?[0-9])'
  },
  'mm': {
    param: 'minute',
    src: '[0-5]\\d'
  },
  'ss': {
    param: 'second',
    src: '[0-5]\\d(?:[,.]\\d+)?'
  },
  'tzHour': {
    src: '[-−+](?:2[0-4]|[01]?[0-9])'
  },
  'tzMinute': {
    src: '[0-5]\\d'
  },
  'iyyyy': {
    param: 'year',
    src: '(?:[-−+]?\\d{4}|[-−+]\\d{5,6})'
  },
  'ihh': {
    param: 'hour',
    src: '(?:2[0-4]|[01][0-9])(?:[,.]\\d+)?'
  },
  'imm': {
    param: 'minute',
    src: '[0-5]\\d(?:[,.]\\d+)?'
  },
  'GMT': {
    param: 'utc',
    src: 'GMT'
  },
  'Z': {
    param: 'utc',
    src: 'Z'
  },
  'timestamp': {
    src: '\\d+'
  }
};

module.exports = CoreParsingTokens;