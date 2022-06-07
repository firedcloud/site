# ffs [![Build Status](https://travis-ci.org/killdream/ffs.png)](https://travis-ci.org/killdream/ffs) ![Dependencies Status](https://david-dm.org/killdream/ffs.png)

A high-level promised wrapper on Node's FS module. For fuck's sake!

Everything is curried and promised for your convenience. Take a look at the
`docs/api.doll` file for an overview of the types and functions in the API.


### Example

```js
var ffs         = require('ffs')
var combinators = require('pinky-combinators')
var all         = combinators.all

files = all([ffs.read('a.txt'), ffs.read('b.txt'), ffs.read('c.txt')])
all([ffs.makeRecursive('foo/bar/baz'), files])
 .then(function(xs){ return xs.reduce(function(a,b){ return a + b }, '') })
 .then(ffs.write('utf8', 'foo/bar/baz/'))
```


### Installing

Just grab it from NPM:

    $ npm install ffs


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
