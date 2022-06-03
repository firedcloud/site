var log = console.log
    , Funny = require( '../' )
    // cusotm scope
    , scope = {
        field : 'value' 
    }
    // fn to bind
    , fn = function () {
        log( '\n - fn args --> %j', arguments );
        log( ' - fn scope --> %j\n', this );
    }
    // arguments to bind
    , bargs = [ 'barg1', 'barg2', 'barg3' ]
    // bind fn to args
    , boundFn = Funny.bind( fn, bargs, scope )
    // calling args
    , cargs = [ 'carg1', 'carg2', 'carg3' ]
    ;

log( '\n- call fn with arguments/scope: %s / %j', cargs, scope );
fn.apply( scope, cargs );

log( '- bind fn to arguments/scope: %s / %j', bargs, scope );
boundFn( 'carg1', 'carg2', 'carg3' );