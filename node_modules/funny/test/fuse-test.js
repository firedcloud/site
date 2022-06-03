#!/usr/bin/env node

/* 
 * Funny#fuse test
 * basically is a shortcut for precede,
 * test only if the fn object property was replaced
 * with fused functions.
 */

var log = console.log
    , Funny = require( '../' )
    , slice = Funny.slice
    // fuse fn
    , fuse = Funny.fuse
    , zn = function ( err, msg, fire ) {
        fire( err );
    }
    , o = {
        fn :function ( err ) {
        }
    }
    , env = { 'zZz' : 'Zzz' }
    /*
     * fuse zn and o['fn'], it is a shortcut for:
     * o['fn'] = precede( zn, o.fn, env );
     */
    , f = fuse( zn, o, 'fn', env )
    ;

f( new Error( 'an error present' ), 'ouch!' );

log( '- check if fuse replaces object function with fused functions: %s', ( o[ 'fn' ] === f ) ? 'yes!!' : 'nope..' );