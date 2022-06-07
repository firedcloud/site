'use strict';

var CoreParsingFormats = [
  {
    // 12-1978
    // 08-1978 (MDY)
    src: '{MM}[-.\\/]{yyyy}'
  },
  {
    // 12/08/1978
    // 08/12/1978 (MDY)
    time: true,
    src: '{dd}[-\\/]{MM}(?:[-\\/]{yyyy|yy|y})?',
    mdy: '{MM}[-\\/]{dd}(?:[-\\/]{yyyy|yy|y})?'
  },
  {
    // 12.08.1978
    // 08.12.1978 (MDY)
    time: true,
    src: '{dd}\\.{MM}(?:\\.{yyyy|yy|y})?',
    mdy: '{MM}\\.{dd}(?:\\.{yyyy|yy|y})?',
    localeCheck: function(loc) {
      // Do not allow this format if the locale
      // uses a period as a time separator.
      return loc.timeSeparator !== '.';
    }
  },
  {
    // 1975-08-25
    time: true,
    src: '{yyyy}[-.\\/]{MM}(?:[-.\\/]{dd})?'
  },
  {
    // .NET JSON
    src: '\\\\/Date\\({timestamp}(?:[-+]\\d{4,4})?\\)\\\\/'
  },
  {
    // ISO-8601
    src: '{iyyyy}(?:-?{MM}(?:-?{dd}(?:T{ihh}(?::?{imm}(?::?{ss})?)?)?)?)?{tzOffset?}'
  }
];

module.exports = CoreParsingFormats;