'use strict';

var hasArgsRegex = /^[^(]+\([^)]+\)/;

function args (arg) {
    return [].slice.call(arg);
}

function invoke (mac, func, callback) {
    var called = false;
    var isFunc = typeof func === 'function';
    var isFuncHasArgs = isFunc && hasArgsRegex.test(func.toString());
    var result;

    function callbackWrapper () {
        if (!called) {
            called = true;
            callback();
        }
    }

    if (isFunc) {
        if (isFuncHasArgs) {
            func(callbackWrapper);
        } else {
            result = func();
        }
    } else {
        result = func;
    }

    if (result) {
        if (result.on) {
            mac.opts.on.split(' ').forEach(function (evt) {
                result.on(evt, callbackWrapper);
            });
        } else if (result.then) {
            result.then(callbackWrapper, callbackWrapper);
        } else {
            callbackWrapper();
        }
    }

    if (!result && !isFuncHasArgs) {
        callbackWrapper();
    }
}

function Mac (opts) {
    this.opts = opts || {};
    this.opts = {
        on: this.opts.on || 'end continue'
    };
}

Mac.prototype = {
    parallel: function () {
        var index = 0;
        var funcs = args(arguments);
        var that = this;
        var total = funcs.length;

        return function (done) {
            if (!total) {
                return done();
            }

            funcs.forEach(function (func) {
                invoke(that, func, function () {
                    ++index;

                    if (index === total) {
                        done();
                    }
                });
            });
        };
    },

    series: function () {
        var index = 0;
        var funcs = args(arguments);
        var that = this;
        var total = funcs.length;

        return function (done) {
            function next () {
                invoke(that, funcs[index], function () {
                    ++index;

                    if (index === total) {
                        done();
                    } else {
                        next();
                    }
                });
            }

            if (!total) {
                return done();
            }

            next();
        };
    }
};

var mac = new Mac();
mac.mac = function (opts) { return new Mac(opts); };
mac.Mac = Mac;
module.exports = mac;
