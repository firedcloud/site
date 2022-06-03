#!/usr/bin/env node

/* 
 * Funny#precede test
 */

var log = console.log
    , assert = require( 'assert' )
    , Funny = require( '../' )
    , slice = Funny.slice
    // precede fn
    , precede = Funny.precede
    // 1st function
    , zn = function () {
        var args = slice( arguments ) || [];
        assert.ok( args[ 0 ] === err, '1st argument should be an error, now is: ' + args[ 0 ] );
        log( '- check arguments passed to the 1st function.' );
        assert.ok( args[ 1 ] === msg, '2nd argument should be a string, now is: ' + args[ 1 ] );
        assert.ok( typeof args[ 2 ] === 'function', '3rd argument should be a function, now is: ' + args[ 2 ] );

        log( '- check current scope for 1st function.' );
        assert.ok( this === env, 'wrong scope for 2nd function!' );

        // wait 3 secs
        log( '- now 1st function sleeps for 3 secs...' );
        setTimeout( function () {
            log( '- test if 2nd function is not already executed.' );
            assert.ok( ! flag, 'damn! 2nd function was already executed!' );
            log( '- ok, executing 2nd function.' );
            args[ 2 ]( args[ 0 ], args[ 1 ] );
        }, 3000 );
    }
    , o = {
        // 2nd function
        fn : function ( err ) {
            var args = slice( arguments ) || [];
            flag = true;
            log( '- check arguments passed to the 2nd function.' );
            assert.ok( args[ 0 ] === err, '1st argument should be an error, now is: ' + args[ 0 ] );
            assert.ok( args[ 1 ] === msg, '2nd argument should be a string, now is: ' + args[ 1 ] );
            log( '- check current scope for 2nd function.' );
            assert.ok( this === env, 'wrong scope for 2nd function!' );
        }
    }
    , env = { 'zZz' : 'Zzz' }
    // precede execution of o.fn by zn
    , f = precede( zn, o.fn, env )
    , err = new Error( 'an error present' )
    , msg = 'ouch!'
    , flag = false
    ;

f( err, msg );