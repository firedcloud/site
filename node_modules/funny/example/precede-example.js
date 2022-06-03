var log = console.log
    , Funny = require( '../' )
    , slice = Funny.slice
    // precede fn
    , precede = Funny.precede
    , zn = function ( err, msg, fire ) {
        log( '\n- zn args:', slice( arguments ) );
        log( '- zn scope:', this );
        log( '- zn will sleep for 3 secs..' );
        setTimeout( function () {
            log( '- zn ends execution, now firing o.fn' );
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
    // precede execution of o.fn by zn
    , f = precede( zn, o.fn, env )
    ;

f( new Error( 'an error present' ), 'ouch!' );