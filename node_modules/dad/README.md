# Dad
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

Composable data stores for node.js and the browser. Dad's small ~300 SLOC
codebase implements only methods that are common in most datastores. This
includes models, validation and persistance.

No assumptions about your backend are made. Through adapters you can
synchronize your data with any backend. Official adapters are a WIP.

## Installation
````bash
$ npm i --save dad
````

## References
- [Issues](https://github.com/yoshuawuyts/dad/issues)
- [Pull Requests](https://github.com/yoshuawuyts/dad/pulls)
- [Wiki](https://github.com/yoshuawuyts/dad/wiki)

## Overview
````js
var rest = require('dad-rest');
var dad = require('dad');
var store = dad('books');

// Set the schema.
store.schema = {
  title: {type: 'string', required: true},
  author: {type: 'string', required: true},
  pages: {type: 'number'}
};

// Set the adapters.

store.adapters = [
  rest('localhost:1337/books')
];

// Start moving data around, and save it to
// our REST backend.
store.add({
  title: 'Ferrets',
  author: 'Tobi',
  pages: 12
});

store.update({
  title: 'Lizards',
  author: 'Tobi',
  pages: 12
});
````

## API
#### dad(name)
Create a named store.
````js
var dad = require('dad');
var store = dad('books');
````

#### .schema = schema
Define the schema for the store.
````js
store.schema = {
  title: {type: 'string', required: true},
  author: {type: 'string', required: true},
  pages: {type: 'number'}
};
````

#### .adapters = adapters
Define the adapters to be called.
```js
var localStorage = require('dad-localStorage');
var rest = require('dad-rest');

store.adapters = [
  localStorage,
  rest
];
```

### Validation
#### .validate(key, value)
Validate a value against a key in the schema.
```js
store.validate({
  title: 'bar',
  author: 'bin'
});
```

#### .allAccountedFor(record)
Check if an object accounts for all properties demanded by the schema.
```js
store.allAccountedFor({
  title: 'bar',
  author: 'bin'
});
```

### Transactions
#### .add(record)
Save a record or an array of records to the store. Also calls all
registered adapters. Emits a `change` event when done.
````js
store.add({
  title: 'Fatherly jokes',
  author: 'Tobi',
  pages: 12,
  chapters: [0]
});
````

#### .get()
Get all records from the store. Also calls all registered adapters.
````js
store.get();
````

#### .update(record)
Update a record. Also calls all registered adapters.
Emits a `change` event when done.
````js
store.update({
  title: 'Fatherly jokes',
  author: 'Tobi',
  pages: 12
});
````

#### .remove(record)
Remove a record from the store. Also calls all registered adapters.
Emits a `change` event when done.
````js
store.remove({
  title: 'Fatherly jokes',
  author: 'Tobi',
  pages: 12
});
````

### Persistance
#### .fetch([config])
Fetch records from the server over HTTP. Can be provided with optional HTTP
headers. Emits a `sync` event when completed, else it emits an `error` event.
````js
store.fetch({
  API_KEY: 'mysecretkey',
  ANOTHER_HEADER: 'some value'
});
````

## License
[MIT](https://tldrlegal.com/license/mit-license) © [Yoshua Wuyts](yoshuawuyts.com)

[npm-image]: https://img.shields.io/npm/v/dad.svg?style=flat-square
[npm-url]: https://npmjs.org/package/dad
[travis-image]: https://img.shields.io/travis/yoshuawuyts/dad.svg?style=flat-square
[travis-url]: https://travis-ci.org/yoshuawuyts/dad
[coveralls-image]: https://img.shields.io/coveralls/yoshuawuyts/dad.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/yoshuawuyts/dad?branch=master
