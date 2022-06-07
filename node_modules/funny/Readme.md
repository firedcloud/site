###Funny

[![CODECLIMATE](http://img.shields.io/codeclimate/github/rootslab/funny.svg?style=flat)](https://codeclimate.com/github/rootslab/funny)
[![CODECLIMATE-TEST-COVERAGE](http://img.shields.io/codeclimate/coverage/github/rootslab/funny.svg?style=flat)](https://codeclimate.com/github/rootslab/funny)

[![LICENSE](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/rootslab/funny#mit-license)
[![GITTIP](http://img.shields.io/gittip/rootslab.svg?style=flat)](https://www.gittip.com/rootslab/)
[![NPM DOWNLOADS](http://img.shields.io/npm/dm/funny.svg?style=flat)](http://npm-stat.com/charts.html?package=funny)

[![NPM VERSION](http://img.shields.io/npm/v/funny.svg?style=flat)](https://www.npmjs.org/package/funny)
[![TRAVIS CI BUILD](http://img.shields.io/travis/rootslab/funny.svg?style=flat)](http://travis-ci.org/rootslab/funny)
[![BUILD STATUS](http://img.shields.io/david/rootslab/funny.svg?style=flat)](https://david-dm.org/rootslab/funny)
[![DEVDEPENDENCY STATUS](http://img.shields.io/david/dev/rootslab/funny.svg?style=flat)](https://david-dm.org/rootslab/funny#info=devDependencies)

[![NPM GRAPH1](https://nodei.co/npm-dl/funny.png)](https://nodei.co/npm/funny/)

[![NPM GRAPH2](https://nodei.co/npm/funny.png?downloads=true&stars=true)](https://nodei.co/npm/funny/)

> _Funny_, a jolly helper for functions.

###Install

```bash
$ npm install funny [-g]
// clone repo
$ git clone git@github.com:rootslab/funny.git
```

> __require__ returns an helper hash/obj with some properties/methods.

```javascript
var Funny  = require( 'funny' );
```

###Run Tests

```bash
$ cd funny/
$ npm test
```

###Sample Usage

> See [examples](example/).


###Methods

> Arguments within [ ] are optional.

```javascript
/*
 * Return a function bound to a scope and a series of arguments,
 * passed through an array.
 */
Funny#bind( Function fn, Array args [, Object scope ] ) : Function

/*
 * Empty function.
 */
Funny#emptyFn() : undefined

/*
 * Return input as output.
 */
Funny#echoFn( Object obj ) : Object

/*
 * Shortcut for ( typeof fn === 'function' ) ? fn : emptyFn;
 */
Funny#checkFn( Function fn ) : Function

/*
 * Shortcut for Array.isArray( arr ) ? arr : ( wrap ? [ arr ] : [] );
 */
Funny#checkArr( Array arr, Boolean wrap ) : Array

/*
 * Check if n is a number, otherwise it returns vice.
 * Shortcut for ( ( typeof n === 'number' ) && ! isNaN( n ) ) ? n : +vice;
 */
Funny#checkNum( Number n, Number vice ) : Number

/*
 * Return a new function, bound to fn.
 * For example, to create a shortcut for toString.call:
 *
 * var toString = Funny.mock( toString || Object.prototype.toString );
 * toString( [ 1, 2, 3 ] );
 */
Funny#mock( Function fn ) : Function

/* 
 * Recur is a method to bypass the tail call optimization problem,
 * this method use a 'trampolining' method for recursion, code was
 * based on https://github.com/Gozala/js-tail-call.
 */
Funny#recur( Function fn ) : Function

/*
 * Shortcut for Array.prototype.slice.call
 */
Funny#slice( Object arguments ) : Array

/*
 * Shortcut for Array.prototype.push.apply
 */
Funny#push( Array dest [, Array source ] ) : Number

/*
 * Shortcut for toString.call || Object.prototype.toString.call
 */
Funny#toString( Object obj ) : String

/*
 * Trigger a function execution before another one.
 *
 * NOTE: regardless of the order of activation/execution,
 * the 2 functions will run in parallel; it means that the first
 * function could also end its execution after the second one.
 */
Funny#trigger( Function fn, Function ln [, Object scope ] ) : Function

/*
 * Chaining functions execution. Every function will be executed
 * in order of appearence and will receive a callback argument to
 * execute the next function, optionally with some desired arguments. 
 *
 * If left was true, the callback is passed as the first
 * argument to the function, otherwise as the last argument.
 */
Funny#chain( Array functions [, Object scope [, Boolean left ] ] ) : Function

/*
 * Pre-execute a fn before another one.
 * The pre-executed function should call the callback,
 * passed as an argument, to launch the second function.
 *
 * If left was true, the callback is passed as the first
 * argument to the function, otherwise as the last argument.
 *
 * It is a shortcut for Funny#chain( [ fn , ln ], .. )
 */
Funny#precede( Function fn, Function ln [, Object scope [, Boolean left ] ] ) : Function

/*
 * Pre-execute a fn before another one ( expressed as an object property ),
 * replacing the latter with the fused function.
 *
 * The pre-executed function should call the callback, passed as an argument,
 * to launch the second function.
 *
 * If left was true, the callback is passed as the first argument
 * to the function, otherwise as the last argument.
 *
 * It is a shortcut for: obj[ fname ] = precede( fn, obj[ fname ], env );
 */
Funny#fuse( Function fn, Object obj, String fname [, Object scope [, Boolean left ] ] ) : Function

```

------------------------------------------------------------------------


### MIT License

> Copyright (c) 2014 &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> 'Software'), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:

> __The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.__

> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
> CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.