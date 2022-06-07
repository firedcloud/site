#!/usr/bin/env node

/* 
 * Funny#bind test
 */

var log = console.log
    , assert = require( 'assert' )
    , util = require( 'util' )
    , Funny = require( '../' )
    // custom scope
    , scope = {
        field : 'value' 
    }
    // fn to bind
    , fn = function () {
    	// returns array from arguments concat with scope
        return Funny.slice( arguments ).concat( scope );
    }
    // arguments to bind
    , bargs = [ 'barg1', 'barg2', 'barg3' ]
    // bind fn to args
    , boundFn = Funny.bind( fn, bargs, scope )
    // calling args
    , cargs = [ 'carg1', 'carg2', 'carg3' ]
    // correct result
    , result = bargs.concat( cargs ).concat( scope )
    // bound fn to 3 args
    , arr = boundFn( 'carg1', 'carg2', 'carg3' )
    ;

log( '- function bound to arguments %j and scope %j', bargs, scope );

log( '- check if function arguments %j are prepended by %j', cargs, bargs );
log( '- result is -> %j', arr );
assert.deepEqual( arr, result, 'wrong result: ' + arr  );

log( '- check if the scope was set correctly as %j', scope );
assert.deepEqual( arr[ arr.length - 1 ], scope, 'wrong result for scope!' );
