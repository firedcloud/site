# Pinky Combinators [![Build Status](https://travis-ci.org/killdream/pinky-combinators.png)](https://travis-ci.org/killdream/pinky-combinators) ![Dependencies Status](https://david-dm.org/killdream/pinky-combinators.png)

Sweet combinators for promises/a+.

Even though it uses pinky under the covers, it should be interoperable with any
library implementing the promises/a+ specification.


### Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :3

[![browser support](http://ci.testling.com/killdream/pinky-combinators.png)](http://ci.testling.com/killdream/pinky-combinators)


### Example

```js
var pinky = require('pinky')
var p = require('pinky-combinators')

// Sequencing operations
p.pipeline([ read('user.json')
           , JSON.parse
           , get('data')
           , JSON.stringify
           , write('data.json') ])
 .otherwise(function(e){ throw e })

// Or function-composition style f . g
p.compose([ splitLines, read('log.txt') ])
 .then(function(lines){ ... })

// Parallel computations
p.all([ read('a.txt'), read('b.txt'), read('c.txt') ])
 .then( function(as)  { console.log(as.join('\n')) }
      , function(err) { throw err                  })
 
// First come, first served
p.any([ request('http://api.example.com/foo')
      , request('http://api2.example.com/foo') ])
 .then(function(a){ saveToDatabase(a) }, function(err){ throw err })
```


### Installing

Just grab it from NPM:

    $ npm install pinky-combinators


### Documentation

A quick reference of the API can be built using [Calliope][]:

    $ npm install -g calliope
    $ calliope build


### Tests

You can run all tests using Mocha:

    $ npm test


### Licence

MIT/X11. ie.: do whatever you want.

[Calliope]: https://github.com/killdream/calliope
[es5-shim]: https://github.com/kriskowal/es5-shim
