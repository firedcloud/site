# mac

> "Never break the chain." - Fleetwood Mac

A tiny library designed to parallel or series chain streams, promises or functions with callbacks.

## Installing

```
npm install mac
```

## Including

```
var mac = require('mac');
```

## Usage

Mac is designed to work with any combination of streams, promises or functions that define a single argument and will ensure that they are called in parallel or series. Since Mac returns a function that defines a callback, you can pass it into itself. The function that is returned when called begins executing the Mac chain.

### Streams

Working with streams allows it to work with a multitude of libraries, most notably of these is probably Gulp, but it can be used with any sort of stream.

The following would ensure that your JS is transpiled from ES6 to ES5 and when that is finished it would then minify the `dist`.

```js
var js = mac.series(
  gulp.src('src/*.js').pipe(gulpBabelify).dest('dist'),
  gulp.src('dist/*.js').pipe(gulpUglify).dest('dist')
);
```

If you want to run some tasks in paralell you can do that too. For example, if you wanted to take your JavaScript task and run it in parallel with your Less task, go for it:

```js
var dist = mac.parallel(
  js,
  gulp.src('src/*.less').pipe(gulpLess).dest('dist')
);
```

Gulp is probably the shining example of this as most people will know it, but it can work with any stream that emits the `finish` event.

### Promises

If you wanted to run two `fetch` (returns a promise, see: https://github.com/github/fetch) requests ensuring the first one is called before the second one:

```js
mac.series(
  fetch('some/endpoint'),
  fetch('something/else')
);
```

### Functions

If you wanted to execute a series of functions ensuring one finishes before the other, you should define a single argument. This argument is a callback that you call in order to say that you're done doing whatever you're doing. Once called, it will proceed to the next.

```js
mac.series(
  function (done) {
    setTimeout(done, 100);
  },

  function (done) {
	  updateSomething();
	  done();
  }
);
```

If your task doesn't need to report back, then you don't have to define a callback and call it and it will be called and passed through.

```js
mac.series(
  function (done) {
	  setTimeout(done, 100);
  },

  function () {
	  updateSomething();
  }
);
```

### Build Example

The following is what an ES6 and Less project build might look like. It breaks each part down into separate functions that can be run individually, or batched using the main `dist` module. I chose not to require all the dependencies to reduce cruft, so just assume they're there.

```js
// tasks/dist/babelify.js

module.exports = function () {
  return gulp.src('src/*.js')
    .pipe(gulpBabelify)
    .pipe(gulp.dest('dist'));
};

// tasks/dist/uglify.js

module.exports = function () {
  return gulp.src('dist/*.js')
    .pipe(gulpUglify)
    .pipe(gulp.dest('dist'));
};

// tasks/dist/js.js

module.exports = function () {
  return mac.series(
    require('./babelify'),
    require('./uglify')
  );
};

// tasks/dist/less.js

module.exports = function () {
  return gulp.src('src/*.less')
    .pipe(gulpLess)
    .pipe(gulp.dist('dist'));
};

// tasks/dist/cssmin.js

module.exports = function () {
  return gulp.src('dist/*.css')
    .pipe(gulpCssmin)
    .pipe(gulp.dist('dist'));
};

// tasks/dist/css.js

module.exports = mac.series(
  require('./less'),
  require('./cssmin')
);

// tasks/dist.js

module.exports = mac.parallel(
  require('./dist/css'),
  require('./dist/js')
);

```
