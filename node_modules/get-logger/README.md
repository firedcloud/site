# get-logger &nbsp; [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Downloads][downloads-image]][npm-url]

Node.js logging facade to decouple frameworks, libraries and application code from specific logging implementations.

**[Installation](#installation) |**
**[Usage](#usage) |**
**[API](get-logger.d.ts) |**
**[Changelog](CHANGELOG.md)**

---

`get-logger` is a facade for Node.js logging implementations like [bunyan](https://github.com/trentm/node-bunyan), [pino](https://github.com/pinojs/pino), [debug](https://github.com/visionmedia/debug) and others with the following goal:

*Framework and library authors, as well as application developers, must be capable of adding logging to their code without relying on specific logging implementation.*

This means that `get-logger` is only a small facade over existing logging implementations. It defines a very small API surface area and a few contracts that logging implementations should support. All advanced features such as setting an active log level, defining output streams and the output format is left to the chosen logging implementation.

By default, `get-logger` will log to the `console`.


## Installation

```
yarn add get-logger
# -or-
npm install --save get-logger
```

## Usage
`get-logger` is most helpful because your Node.js modules don't have to rely on specific logging implementations. Because of this, logging implementations can easily be changed. Furthermore, editor and IDEs can auto-generate these logger require statements.

```javascript
const logger = require('get-logger')('<nameOfYourModule>');
```

Loggers support the following log levels and format strings:

```javascript
logger.debug('Power level over %d!', 8000);
logger.info('One does not simply build a %s tool', 'chat');
logger.warn({foo: 'think-of-something-better-than-foo'});
logger.error('Sorry folks!', {error: 'ENOTFOUND'})
```

At last, to configure `get-logger` to use a specific logging implementation, set the logger provider using `setLoggerProvider(name: string): Logger`.

```javascript
require('get-logger').setLoggerProvider(name => {
  return {
    debug,
    info,
    warn,
    error
  };
});
```

[npm-url]: https://npmjs.org/package/get-logger
[npm-image]: http://img.shields.io/npm/v/get-logger.svg

[downloads-image]: http://img.shields.io/npm/dm/get-logger.svg

[travis-url]: https://travis-ci.org/bripkens/get-logger
[travis-image]: http://img.shields.io/travis/bripkens/get-logger.svg

[coveralls-url]: https://coveralls.io/r/bripkens/get-logger
[coveralls-image]: http://img.shields.io/coveralls/bripkens/get-logger/master.svg
