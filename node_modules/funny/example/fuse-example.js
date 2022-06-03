var log = console.log
    , Funny = require( '../' )
    , slice = Funny.slice
    // fuse fn
    , fuse = Funny.fuse
    , zn = function ( err, msg, fire ) {
        log( '\n- zn args:', slice( arguments ) );
        log( '- zn scope:', this );
        log( '- zn will sleep for 3 secs..' );
        setTimeout( function () {
            log( '- zn ends execution, now executing o.fn:' );
            fire( err );
        }, 3000 );
    }
    , o = {
        fn :function ( err ) {
            log( '- o.fn args:', slice( arguments ) );
            log( '- o.fn scope: %j\n', this );
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

log( '- test if o.fn was prepended with zn? %s', ( o[ 'fn' ] === f ) ? 'yes!!' : 'nope..' );