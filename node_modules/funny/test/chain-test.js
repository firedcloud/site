#!/usr/bin/env node

/* 
 * Funny#chain test
 */

var log = console.log
    , assert = require( 'assert' )
    , Funny = require( '../' )
    , slice = Funny.slice
    // chain fn
    , chain = Funny.chain
    // fns to chain
    , f1 = function ( err, msg, fire ) {
        var args = slice( arguments ) || [];
        log( '- check arguments passed to the 1st function.' );
        assert.ok( args[ 0 ] === err, '1st argument should be an error, now is: ' + args[ 0 ] );
        assert.ok( args[ 1 ] === msg, '2nd argument should be a string, now is: ' + args[ 1 ] );
        assert.ok( typeof args[ 2 ] === 'function', '3rd argument should be a function, now is: ' + args[ 2 ] );

        log( '- check current scope for 1st function.' );
        assert.ok( this === env, 'wrong scope for 2nd function!' );
        // wait 3 secs
        log( '- now 1st function sleeps for 3 secs...' );
        setTimeout( function () {
            log( '- test if 2nd function was not already executed.' );
            assert.ok( ++counter === 1, 'damn! 2nd function was already executed!' );
            log( '- ok, executing 2nd function.' );
            args[ 2 ]( args[ 0 ], null, null, null );
        }, 3000 );
    }
    , f2 = function ( err, null1, null2, null3, fire ) {
        var args = slice( arguments ) || [];
        log( '- check arguments passed to the 2nd function.' );
        assert.ok( args[ 0 ] === err, '1st argument should be an error, now is: ' + args[ 0 ] );
        assert.ok( args[ 1 ] === null, '2nd argument should be null, now is: ' + args[ 1 ] );
        assert.ok( args[ 2 ] === null, '3rd argument should be null, now is: ' + args[ 2 ] );
        assert.ok( args[ 3 ] === null, '4th argument should be null, now is: ' + args[ 3 ] );
        assert.ok( typeof args[ 4 ] === 'function', '4th argument should be a function, now is: ' + args[ 4 ] );
        log( '- check current scope for 1st function.' );
        assert.ok( this === env, 'wrong scope for 2nd function!' );
        // wait 3 secs
        log( '- now 2nd function sleeps for 3 secs...' );
        setTimeout( function () {
            log( '- test if 3rd function was not already executed.' );
            assert.ok( ++counter === 2, 'damn! 3rd function was already executed!' );
            log( '- ok, executing 3rd function.' );
            args[ 4 ]();
        }, 3000 );
    }
    , f3 = function ( fire ) {
        var args = slice( arguments ) || [];
        log( '- check arguments passed to the 3rd function.' );
        assert.ok( args.length === 1, 'arguments length should be 1, now is: ' + args.length );
        assert.ok( typeof args[ 0 ] === 'function', '1st argument should be a function, now is: ' + args[ 2 ] );
        log( '- test if 3rd function was executed at last.' );
        assert.ok( ++counter === 3, 'damn! something goes wrong, counter should be = 3, now is: ' + counter );
    }
    , env = { 'zZz' : 'Zzz' }
    , flist = [ f1, f2, f3 ]
    , err = new Error( 'fire!' )
    , msg = 'ouch!'
    , counter = 0
    ;

var fn = chain( flist, env );

fn( err, msg );