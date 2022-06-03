var log = console.log
    , Funny = require( '../' )
    , slice = Funny.slice
    // trigger fn
    , trigger = Funny.trigger
    , o = {
        fn : function () {
            log( '- executing o.fn with args/scope: %j / %j', slice( arguments ), this );
        }
    }
    , zn = function () {
        log( '\n- trigger zn execution before fn with args/scope: %j / %j', slice( arguments ), this );
        log( '- zn sleeps for 3 secs..')
        setTimeout( function () {
            log( '- BEWARE! zn execution triggers with fn but it could end after it!\n' );
        }, 3000 );
    }
    , env = { 'zZz' : 'Zzz' }
    , nothing = trigger( zn, o.fn, env )( 'wakeup!' )
    ;