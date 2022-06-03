# Pinky for Fun [![Build Status](https://travis-ci.org/killdream/pinky-for-fun.png)](https://travis-ci.org/killdream/pinky-for-fun) ![Dependencies Status](https://david-dm.org/killdream/pinky-for-fun.png)

Pinky wrappers for regular and asynchronous functions.


### Platform support

Should work fine on ES3.

[![browser support](http://ci.testling.com/killdream/pinky-for-fun.png)](http://ci.testling.com/killdream/pinky-for-fun)


### Example

```js
var pinkyFun = require('pinky-for-fun')

var add = function(a, b){ return a + b }
var addP = pinkyFun.lift(add)

addP(2, 3).then(function(result){ console.log(result) })

var readP = pinkyFun.liftNode(fs.readFile)
readP('foo.txt', 'utf-8').then(function(data){ ... }, function(err){ ... })
```


### Installing

Just grab it from NPM:

    $ npm install pinky-for-fun


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
