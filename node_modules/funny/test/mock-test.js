#!/usr/bin/env node

/* 
 * Funny#mock test
 */

var log = console.log
    , assert = require( 'assert' )
    , util = require( 'util' )
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
            , otype = toString( args )
            ;

        log( '- test if slice result is an array:', Array.isArray( args ) );
        assert.ok( Array.isArray( args ), 'wrong slice result: %j', args );

        log( '- test if toString result is "[object Array]": %s', otype );
        assert.ok( ( otype === '[object Array]' ), 'wrong toString result' );

        log( '- compare slice and Array.prototype.slice results.' );
        assert.deepEqual( Array.prototype.slice.call( arguments ), args );

        log( '- compare toString and Object.prototype.toString results.' );
        assert.ok( toString.call( arguments ), otype );

        log( '- created arr1 from fn arguments: %j', arr1 );
        log( '- created arr2 from fn arguments: %j', arr2 );

        log( '- pushing arr1 into arr2 should returns %d', args.length );
        assert.ok( push( arr2, arr1 ) === args.length, 'something goes wrong with Funny#push!' )

        log( '- compare if arr2 is equal to the expected result: %j', [ 4, 5, 6, 1, 2, 3 ] );
        assert.deepEqual( arr2, [ 4, 5, 6, 1, 2, 3 ], 'arr2 result is not as we expected!' );

    }
    // get result
    , result = fn( 1, 2, 3, 4, 5, 6 )
    ;