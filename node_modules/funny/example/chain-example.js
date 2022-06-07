var log = console.log
    , Funny = require( '../' )
    , slice = Funny.slice
    // chain fn
    , chain = Funny.chain
    // fns to chain
    , f1 = function ( err, fire ) {
        log( '\n- f1 args:', slice( arguments ) );
        log( '- f1 scope:', this );
        fire( new Error( 'fire from f1' ) );
    }
    , f2 = function ( err, fire ) {
        log( '- f2 args:', slice( arguments ) );
        log( '- f2 scope:', this );
        fire( new Error( 'fire from f2' ) );
    }
    , f3 = function ( err, fire ) {
        log( '- f3 args:', slice( arguments ) );
        log( '- f3 scope: %j\n', this );
    }
    , env = { 'zZz' : 'Zzz' }
    , flist = [ f1, f2, f3 ]
    ;

var fn = chain( flist, env );

fn( new Error( 'fire!' ) );