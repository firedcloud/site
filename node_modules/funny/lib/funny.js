/*
 * Funny, a jolly helper for functions.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Funny = ( function () {
        // legacy flag
    var legacy = !!false
        // shortcuts
        , aproto = Array.prototype
        , fproto = Function.prototype
        , oproto = Object.prototype
        , isArray = Array.isArray
        // bind to multiple arguments
        , bind = function ( fn, arr, scope ) {
            return fproto.bind.apply( fn, [ scope ].concat( arr ) );
        }
        , echoFn = function ( voice ) {
            return voice;
        }
        , emptyFn = function () {
        }
        , checkFn = function ( fn ) {
            return ( typeof fn === 'function' ) ? fn : emptyFn;
        }
        , checkArr = function ( arr, wrap ) {
            return isArray( arr ) ? arr : ( wrap ? [ arr ] : [] );
        }
        , checkNum = function ( n, vice ) {
            return ( ( typeof n === 'number' ) && ! isNaN( n ) ) ? n : +vice;
        }
        // returns a new function, bound to fn
        , mock = function ( fn, apply ) {
            return ( apply ) ?
                fproto.apply.bind( fn ) :
                fproto.call.bind( fn )
                ;
        }
        /*
         * shortcuts for:
         * - Array.prototype.slice.call 
         * - Array.prototype.push.apply
         * - toString.call
         */
        , slice = mock( aproto.slice )
        , push = mock( aproto.push, true )
        , toString = mock( oproto.toString )

        // a bind polyfill
        , prepend = function ( fn, arr, scope ) {
            return function () {
                var args = slice( arguments );
                if ( arr ) {
                    if ( isArray( arr ) ) {
                        args = arr.concat( args );
                    } else {
                        args = [ arr ].concat( args );
                    }
                }
                return fn.apply( scope, args );
            };
        }
        /* 
         * recur method is to bypass the tail call recursion problem,
         * this method use a 'trampolining' method for recursion, code was
         * based on https://github.com/Gozala/js-tail-call
         */
        , recur = function ( fn ) {
            var result = null
                , active = false
                , args = []
                ;
            return function () {
                // on every call, given set of parameters are accumulated.
                args.push( arguments );
                if ( ! active ) {
                    /*
                     * if accumulator is inactive, is not in the process
                     * of tail recursion, activate it and start accumulating
                     * parameters.
                     */
                    active = true;
                    /* 
                     * if wrapped 'fn' performs tail call, then new set of parameters will
                     * be accumulated causing new iteration in the loop. If 'fn' does not
                     * performs tail call then accumulation is finished and result is
                     * returned.
                     */
                    while ( args.length ) {
                        result = fn.apply( this, args.shift() );
                    }
                    active = false;
                    return result;
                }
            };
        }
        /*
         * trigger a function execution before another one.
         * Note that, regardless of the order of activation/execution,
         * the 2 functions will run in parallel; it means that the
         * first function could also end its execution after the second one.
         */
        , trigger = function ( fn, ln, scope ) {
            var env = scope || this;
            return function () {
                fn.apply( env, arguments );
                ln.apply( env, arguments );
            };
        }
        /*
         * chaining functions execution.
         * Every function will be executed in order of appearence and
         * will receive a callback argument to execute the next function,
         * optionally with some desired arguments. 
         * If left was true, the callback is passed as the first
         * argument to the function, otherwise as the last argument.
         */
        , chain = function ( fns, scope, left ) {
            var env = scope || this
                , queue = fns
                , fn = queue[ 0 ]
                , qlim = queue.length - 1
                , q = 0
                , fire = function () {
                    var args = slice( arguments ) || []
                        ;
                    if ( q < qlim ) {
                        fn = queue[ ++q ];
                        fn.apply( env, args.concat( fire ) );
                    }
                }
                ;
            return function () {
                var args = slice( arguments ) || []
                    , cargs = ( left ) ? [ fire ].concat( args ) : args.concat( fire )
                    ;
                fn.apply( env, cargs );
                return env;
            };
        }
        /*
         * pre-execute a fn before another one.
         * The pre-executed function should call the callback,
         * passed as an argument, to launch the second function.
         * If left was true, the callback is passed as the first
         * argument to the function, otherwise as the last argument.
         */
        , precede = function ( fn, ln, scope, left ) {
            var env = scope || this
                , fire = function () {
                    ln.apply( env, slice( arguments ) || [] );
                }
                ;
            return function () {
                var args = slice( arguments ) || []
                    , cargs = ( left ) ? [ fire ].concat( args ) : args.concat( fire )
                    ;
                fn.apply( env, cargs );
                return env;
            };
        }
        /*
         * pre-execute a fn before another one ( expressed as an object property ),
         * replacing the latter with the fused function. It is a shortcut for:
         * obj[ fname ] = precede( fn, obj[ fname ], env );
         * The pre-executed function should call the callback, passed as an argument,
         * to launch the second function.
         * If left was true, the callback is passed as the first argument to the function,
         * otherwise as the last argument.
         */
        , fuse = function ( fn, obj, fname, scope, left ) {
            return obj[ fname ] = precede( fn, obj[ fname ], scope, left );
        }
        ;
    return {
        bind : ( legacy ) ? prepend : bind
        , checkFn : checkFn
        , checkArr : checkArr
        , checkNum : checkNum
        , echoFn : echoFn
        , emptyFn : emptyFn
        , mock : mock
        , recur : recur
        , push : push
        , slice : slice
        , toString : toString
        , trigger : trigger
        , chain : chain
        , precede : precede
        , fuse : fuse
    };

} )();