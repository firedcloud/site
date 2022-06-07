'use strict';

const EventEmitter = require('events');
const getConsoleLogger = require('./getConsoleLogger');

var loggerProvider = getConsoleLogger;
var events = new EventEmitter();

module.exports = exports = function getLogger (name) {
  var impl = loggerProvider(name);

  events.on('loggerProvider', function onLoggerProviderChanged () {
    impl = loggerProvider(name);
  });

  return {
    debug: function debug () {
      return impl.debug.apply(impl, arguments);
    },
    info: function info () {
      return impl.info.apply(impl, arguments);
    },
    warn: function warn () {
      return impl.warn.apply(impl, arguments);
    },
    error: function error () {
      return impl.error.apply(impl, arguments);
    }
  };
};

exports.setLoggerProvider = function setLoggerProvider (_loggerProvider) {
  loggerProvider = _loggerProvider || getConsoleLogger;
  events.emit('loggerProvider');
};

if (process.env.NODE_ENV === 'test') {
  exports.nextTestIteration = function nextTestIteration () {
    loggerProvider = getConsoleLogger;
    events = new EventEmitter();
  };
}
