'use strict';

module.exports = function getConsoleLogger (name) {
  return {
    debug: buildLogger('log', name),
    info: buildLogger('info', name),
    warn: buildLogger('warn', name),
    error: buildLogger('error', name)
  };
};

function buildLogger (fnName, loggerName) {
  var fn = console[fnName];
  return function logger (arg0) {
    var args = new Array(arguments.length);
    for (var i = 0, length = arguments.length; i < length; i++) {
      args[i] = arguments[i];
    }

    if (typeof arg0 === 'string') {
      args[0] = loggerName + ': ' + arg0;
    } else {
      args.unshift(loggerName + ':');
    }

    return fn.apply(console, args);
  };
}
