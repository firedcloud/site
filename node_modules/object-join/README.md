# object-join
[![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url] 
[![Test coverage][coveralls-image]][coveralls-url]

Merge two objects recursively into a new object.

## Installation
```bash
$ npm i --save object-join
```

## Overview
```js
/**
 * Initialize
 */

var objectJoin = require('object-join');

/**
 * Declare objects
 */

var obj1 = {foo: 'bar'};
var obj2 = {bin: 'baz'};

/**
 * Merge objects
 */

var newObject = objectJoin(obj1, obj2);
// => {foo: 'bar', bin: 'baz'};
```

## API
#### objectJoin()
Merges two objects into a new object. Takes `{Object} obj1` and `{Object} obj2` 
as arguments. If duplicate keys exist, `{Object} obj2`'s keys take presedence.
```js
var newObject = objectJoin(obj1, obj2);
// => {foo: 'bar', bin: 'baz'};
```

## License
[MIT](https://tldrlegal.com/license/mit-license) © [Yoshua Wuyts](http://yoshuawuyts.com)

[npm-image]: https://img.shields.io/npm/v/object-join.svg?style=flat
[npm-url]: https://npmjs.org/package/object-join
[travis-image]: https://img.shields.io/travis/yoshuawuyts/object-join.svg?style=flat
[travis-url]: https://travis-ci.org/yoshuawuyts/object-join
[coveralls-image]: https://img.shields.io/coveralls/yoshuawuyts/object-join.svg?style=flat
[coveralls-url]: https://coveralls.io/r/yoshuawuyts/object-join?branch=master