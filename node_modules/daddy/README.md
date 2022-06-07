# Daddy

  Simple, powerful and fun permission checks for Javascript.
  
  [![NPM Version](https://img.shields.io/npm/v/daddy.svg)](https://www.npmjs.com/package/daddy)
  [![Coverage Status](https://coveralls.io/repos/teemualap/daddy/badge.svg?branch=master)](https://coveralls.io/r/teemualap/daddy?branch=master)
  [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/teemualap/daddy/master/LICENSE)


## Installation

```bash
$ npm install daddy
```


## Usage

  ECMAScript 6 version is the default:

```js

import Daddy from 'daddy';

```

  For ECMAScript 5 compatibility, use the distributed commonJS build.

```js

var Daddy = require('daddy/es5');

```

  Daddy uses the native ES6 Promise spec by default. You can use any Promises/A+ compliant implementation though, by setting it with setPromiseImplementation();

```js

var d       = new Daddy(),
    Promise = require('bluebird');

d.setPromiseImplementation(Promise);
// now daddy uses bluebird when returning async results from daddy.when

```

### A common use case:

```js

function getCurrentUser() {
  return {
    name: 'Teemu',
    role: 'admin'
  };
}

function ensureAdmin(user) {
  return (user.role === 'admin')
    ? true
    : 'Must be admin';
}

//
// Daddy instance, not mad
var dad = new Daddy();

//
// set current user as the default parameter for checks
dad.defineParamsGetter(getCurrentUser);

//
// The permission to do stuff requires admin
dad.permission('doStuff', ensureAdmin);

dad.check('doStuff').granted === true;
dad.check('doUnknownAction').granted === true; // because dad is not mad

```

  And preferably do checks async:

```js 
  
dad.when('illegalAction').catch(function(rejection) {
  // rejection.granted === false;
  // rejection.reason === 'Whatever was returned from the failing handler';
});

```

## API


#### new Daddy(mad)

| Param     | Type      | Description
| :-------- | :------   | :-------
| *mad*     | `Boolean` | If set to true, will deny all unknown permissions.



#### Daddy.permission(pattern *, handler *, ...)

| Param     | Type              | Description
| :-------- | :------           | :-------
| *pattern* | `String|RegExp`   | A unique pattern, throws on dupes. 
| *handler* | `function`        | A handler function that gets called on Daddy.check. Supports multiple handlers.  

Use RegExp for useful catch-many permissions or namespacing:

```js

// for example, allow only admins to do remove actions. 
// Eg. 'removePost','removeComment'.
daddy.permission(/^remove/, ensureAdmin);

// or
// require a registered user to crud comments. 
// Eg. 'Comment','viewComment','createComment'...
daddy.permission(/Comment$/, ensureRegistered);

```


#### Daddy.defineParamsGetter(fn *)

| Param     | Type
| :-------- | :------ 
| *fn*      | `Function`

  Register a param getter function in a daddy instance. It set, will head its' return value in params passed to check. This is especially useful for user authorization when you know for sure that the current user is always needed in checks.


#### Daddy.check(name *, param,  ...)

| Param     | Type      | Description
| :-------- | :------   | :-------
| *name*    | `String`  | The permission name to be matched against.
| *param*   | `any`     | Optional parameters to be passed to permission layer handlers.

  Performs a synchronous check returning a result object:

  ```js
  {
    granted: Boolean, // did it pass?
    reason: any // the value returned from the failing handler
  }
  ```

  Calls each handler in each satisfying permission layer, passing in the result of paramsGetter, if set, and passed **param**(s) as arguments. Short circuits as soon as any of the handlers return false.

  Layer lookups are cached, so subsequent calls with the same **name** are quaranteed to be as fast as accessing an array by a known index.


#### Daddy.check(name *, param,  ...)

  Identical to Daddy.check but:

  Performs an asynchronous check returning a promise that resolves or rejects with the result object.

  Daddy uses ECMAScript 6 Promises by default. You can change the implementation with:

#### Daddy.setPromiseImplementation(Promise)

  For example:

```js

var d       = new Daddy(),
    Promise = require('bluebird');

d.setPromiseImplementation(Promise);
// now daddy uses bluebird when returning async results from daddy.when

```


## More examples

  You may want to namespace permissions:

```js

var daddy = new Daddy();

daddy
  .permission(/^core:/           , ensureRegistered)
  .permission(/^core:utils:/     , ensureDeveloper)
  .permission(/^core:utils:api/  , ensureAdmin);

```

  Or go crazy:

```js

var player  = { name: 'Teemu', type: 'player' },
    enemy   = { name: 'T Rex', type: 'dinosaur' },
    // dad is mad
    permissionManager = new Daddy(true);

//
// Only dinosaurs are allowed to eat anything
permissionManager.permission(/^eat/, function(x) {
  return (x.type === 'dinosaur')
    ? true
    : 'Only dinosaurs are allowed to eat anything';
});

//
// But for some reason cars can only be interacted with by a player
permissionManager.permission(/Car$/, function(x) {
  return (x.type === 'player')
    ? true
    : 'Only players can interact with cars';
});

permissionManager.check('eatBuilding', enemy).granted === true;
permissionManager.check('eatStuff', enemy).granted === true

permissionManager.check('eatCar', enemy);
// -> { granted: false, reason: 'Only players can interact with cars' }

permissionManager.check('eatCar', player); // eat false -> false
// -> { granted: false, reason: 'Only dinosaurs are allowed to eat anything' }
// 
permissionManager.check('driveCar', player).granted === true;

permissionManager.check('idle', player);
// dad is mad
// -> { granted: false, reason: 'No permission layers matched.'}

```


## Contributions

Clone and install deps
```bash
$ npm install
```

Build
```bash
$ npm run build
```

Test
```bash
$ npm run test
```

## License
  
  [MIT](LICENSE)
