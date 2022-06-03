
/* 
 * Funny#recur test
 */

var log = console.log
    , assert = require( 'assert' )
    , util = require( 'util' )
    , Funny = require( '../' )
    , icalls = 0
    , rcalls = 0
    // test fns
    , iter = function ( n ) {
        return ( n > 0 && ++icalls ) ? ( iter( n - 1 ) ) : 0;
    }
    , riter = Funny.recur( function ( n ) {
        return ( n > 0 && ++rcalls  ) ? ( riter( n - 1 ) ) : 0;
    } )
    , i = 16 * 1024 * 1024
    , stime = 0
    , s = 0
    ;

log( '- test fn with %d recursive calls.', i );

assert.throws(
    function () {
        iter( i )
    }
    , function ( err ) {
        return ( err instanceof Error ) ?
               ( log( '- iter fn throws a RangeError as expected (call #%d): "%s".', icalls, err.message ) || true ) :
               false
               ;
    }
    , 'unexpected error'
);

log( '- test recur(fn) with %d recursive calls without throwing a RangeError.', i );

stime = Date.now();

assert.doesNotThrow(
    function () {
        riter( i );
    }
   , 'unexpected error'

);

log( '- check if the total number of recursive calls is: %d', i );
assert.ok( rcalls === i, 'erroneous number of recursive calls: ' + rcalls + ', should be: ' + i )

s = ( Date.now() - stime ) / 1000
log( '- time elapsed: %d secs\n- recur avg exec rate: %d calls/sec', ( s ).toFixed( 2 ), ( i / s ).toFixed( 0 ) );
