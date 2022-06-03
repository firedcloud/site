var log = console.log
    // require Funny
    , Funny = require( '../' )
    // test fn
    iter = Funny.recur( function ( n ) {
        return ( n > 0 ) ? ( iter( n - 1 ) ) : 0;
    } )
    , i = 16 * 1024 * 1024
    , stime = Date.now()
    , s = 0
    ;

iter( i );

s = ( Date.now() - stime ) / 1000

log( '\n- run %d recursive calls without throwing a RangeError', i );

log( '- time elapsed: %d secs\n- avg exec rate: %d calls/sec\n', ( s ).toFixed( 2 ), ( i / s ).toFixed( 0 ) );
