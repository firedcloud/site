var log = console.log
    // require Funny
    , Funny = require( '../' )

    // shortcut to Array.prototype.slice.call
    , slice = Funny.slice || Funny.mock( Array.prototype.slice )

    // shortcut to Object.prototype.toString.call ( toString )
    , toString = Funny.toString || Funny.mock( Object.prototype.toString )

    // shortcut to Array.prototype.push.apply 
    , push = Funny.push || Funny.mock( Array.prototype.push, true )

    // test fn
    , fn = function () {
        // use array proto slice to convert arguments to Array
        var args = slice( arguments || [] )
            , arr1 = slice( arguments || [], 0, 3 )
            , arr2 = slice( arguments || [], 3 )
            // get toString 
            , otype = toString( arr1 )
            , ok = ( otype === '[object Array]' ) && ( Array.isArray( arr1 ) );


        log( '\n- fn arguments: %j', arguments );
        log( '- fn args converted to array : %s! -> %j', ok ? 'yes' : 'nope',  args );
        log( '- toString result: "%s"', otype );

        log( '- created arr1 from arguments, result: %j', arr1 );
        log( '- created arr2 from arguments, result: %j', arr2 );

        log( '- pushing arr1 into arr2 returns %d', push( arr2, arr1 ) );
        log( '- resulting arr2: %j', arr2 );

    }
    // get result
    , result = fn( 1, 2, 3, 4, 5, 6 )
    ;