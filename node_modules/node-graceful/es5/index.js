// +----------------------------------------------------------------------+
// | node-graceful v2 (https://github.com/mrbar42/node-graceful)      |
// | Graceful process exit manager.                                       |
// |----------------------------------------------------------------------|
'use strict';
function Graceful() {
    // options
    this.exitOnDouble = true;
    this.timeout = 30000;
    // constants
    this.DEADLY_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGBREAK', 'SIGHUP'];
    // state
    this._listeners = Object.create(null);
    this.isExiting = false;
}
Graceful.prototype.on = function on(signal, listener, deadly) {
    var _this = this;
    this._registerSignal(signal);
    this._listeners[signal].push(listener);
    // add signal to deadly list
    if (deadly && this.DEADLY_SIGNALS.indexOf(signal) === -1) {
        this.DEADLY_SIGNALS.push(signal);
    }
    return function () { return _this.off(signal, listener); };
};
Graceful.prototype.off = function off(signal, listener) {
    if (!this._listeners[signal])
        return;
    // remove listener if exists
    var index = this._listeners[signal].indexOf(listener);
    if (index !== -1)
        this._listeners[signal].splice(index, 1);
    // clear master listener if no listeners left
    if (!this._listeners[signal].length) {
        this._unregisterSignal(signal);
    }
};
Graceful.prototype.clear = function clear(signal) {
    var _this = this;
    if (signal) {
        delete this._listeners[signal];
        this._unregisterSignal(signal);
    }
    else {
        Object
            .keys(this._listeners)
            .forEach(function (sig) { return _this.clear(sig); });
    }
};
Graceful.prototype.exit = function exit(code, signal) {
    if (typeof code === 'number') {
        process.exitCode = code;
    }
    var simulatedSignal = signal || this.DEADLY_SIGNALS[0];
    this._processSignal(simulatedSignal);
};
Graceful.prototype._registerSignal = function _registerSignal(signal) {
    var _this = this;
    if (this._listeners[signal])
        return;
    this._listeners[signal] = [];
    var handler = function (event) { return _this._processSignal(signal, event); };
    // handle special 'exit' event case
    if (signal === 'exit') {
        this.DEADLY_SIGNALS.forEach(function (deadlySignal) { return process.on(deadlySignal, handler); });
    }
    else {
        process.on(signal, handler);
    }
    // store handler on listeners array for future ref
    this._listeners[signal].__handler__ = handler;
};
Graceful.prototype._unregisterSignal = function _unregisterSignal(signal) {
    if (!this._listeners[signal])
        return;
    var handler = this._listeners[signal].__handler__;
    // handle special 'exit' event case
    if (signal === 'exit') {
        this.DEADLY_SIGNALS.forEach(function (deadlySignal) { return process.removeListener(deadlySignal, handler); });
    }
    else {
        process.removeListener(signal, handler);
    }
    delete this._listeners[signal];
};
Graceful.prototype._processSignal = function _processSignal(signal, event) {
    var _this = this;
    var deadly = signal === 'exit' || this.DEADLY_SIGNALS.indexOf(signal) !== -1;
    var listeners = this._listeners[signal] && this._listeners[signal].slice();
    var exitListeners = this._listeners['exit'] && this._listeners['exit'].slice();
    var targetCount = listeners && listeners.length || 0;
    // also include exit listeners if deadly
    if (deadly && exitListeners && signal !== 'exit') {
        targetCount += exitListeners.length;
    }
    // this should never happen
    if (!targetCount) {
        return process.nextTick(function () { return _this._killProcess(); });
    }
    var quit = (function () {
        var count = 0;
        return function () {
            count++;
            if (count >= targetCount) {
                if (deadly)
                    _this._killProcess();
            }
        };
    })();
    // exec signal specific listeners
    if (listeners && signal !== 'exit') {
        listeners.forEach(function (listener) { return _this._invokeListener(listener, quit, event, signal); });
    }
    // also invoke exit listeners
    if (deadly && exitListeners) {
        if (this.isExiting) {
            if (this.exitOnDouble)
                this._killProcess(true);
        }
        else {
            this.isExiting = true;
            if (Number(this.timeout)) {
                setTimeout(function () { return _this._killProcess(true); }, this.timeout);
            }
            exitListeners.forEach(function (listener) { return _this._invokeListener(listener, quit, event, signal); });
        }
    }
};
Graceful.prototype._killProcess = function _killProcess(force) {
    process.exit(process.exitCode || (force ? 1 : 0));
};
Graceful.prototype._invokeListener = function _invokeListener(listener, quit, event, signal) {
    var invoked = false;
    // listener specific callback
    var done = function () {
        if (!invoked) {
            invoked = true;
            quit();
        }
    };
    var retVal = listener(done, event, signal);
    // allow returning a promise
    if (retVal && typeof retVal.then === 'function' && typeof retVal["catch"] === 'function') {
        retVal.then(done)["catch"](done);
    }
};
var graceful = new Graceful();
module.exports = graceful;
// monkey patch exports to support both old & new & Typescript module systems
module.exports.Graceful = graceful;
module.exports["default"] = graceful;
