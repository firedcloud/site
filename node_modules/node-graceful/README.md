# node-graceful

[![Build Status](https://travis-ci.org/mrbar42/node-graceful.svg?branch=master)](https://travis-ci.org/mrbar42/node-graceful)[![npm](https://img.shields.io/npm/v/node-graceful.svg)](https://www.npmjs.com/package/node-graceful)

node-graceful is a small helper module without dependencies that aims to ease graceful exit
 of complex node programs including async waiting on multiple independent modules.

Installation:
`npm i -S node-graceful`

Had any problem? open an [issue](https://github.com/mrbar42/node-graceful/issues/new)

## Quick example

```javascript
const Graceful = require('node-graceful');

Graceful.on('exit', (done, event, signal) => {
    setTimeout(() => {
        console.log(`Received ${signal} - Exiting gracefully`)
        done()
    }, 1000);
})

//  Gracefull will wait untill all listeners had finished
Graceful.on('exit', () => {
       console.log("Another independant listener!");
       return Promise.resolve('A promise to be waited on before dying');
    });
```

The module is written in Node 4.x flavored es6.
  To get the es5 transpiled version use `require('node-graceful/es5')`


## Graceful

### Graceful.on({String} signal, {Function} listener [, {Boolean} deadly])

Add a listener to a given signal.
Any signal can be listened on in the addition of `exit` event that will be triggered by all "Deadly events".
Graceful listens on every signal only once and propagate the event to its listeners

Default Deadly events: `SIGTERM` `SIGINT` `SIGBREAK` `SIGHUP`

#### Options
- `signal` - a string representing the signal name. this will be used directly as the event name on `process` object.
    Common signals can be found [here](https://nodejs.org/api/process.html#process_signal_events).
     its better to use the built in `exit` event as it catches all events that induce process exit.
- `listener(done, event, signal)` - listener function
    - `done` - callback that should be called once all exiting tasks were completed
    - `event` - if an event was provided by the process it will be provided as second argument else undefined
    - `signal` - the signal that triggered the exit.example: 'SIGTERM'

    **note: Promise can be returned instead of calling `done`
- `deadly` - (options) boolean indicating weather this should be considered a process ending event.
e.g. should `exit` event should be called due to this event. default: false.

#### Return value
the method returns a function that when invoked, removes the listener.
the function is a shorthand for `.off` method

##### example
```javascript

const server = require('http').createServer(function (req, res) {
    res.write('ok');
    res.end()
})

Graceful.on('exit', (done, event, signal) => {
    console.log("Received exit signal");
    server.close(() => {
        console.log("Closed all connection. safe to exit");
        done()
    })
})

// use the return value to remove listener
const removeListener = Graceful.on('exit', () => {})
removeListener(); // listener was removed
```


### Graceful.off({String} signal, {Function} listener)

Remove listener.

##### example
```javascript

const gracefulExit = () => {
    console.log("exiting!");
}

// add listener
let removeListener = Graceful.on('SIGTERM', gracefulExit);

// remove listener
Graceful.off('SIGTERM', gracefulExit);

// or use return value of on
removeListener();
```


### Graceful.clear({String} \[signal])

Remove all listeners of a given signal or all listeners of all signals.

- `signal` - (optional) signal to be cleared from all of its listeners.
 if no signal is provided all listeners for all signals are cleared
 effectively resetting the module.

##### example
```javascript

const gracefulExit = () => {
    console.log("exiting!");
}

// add listener
Graceful.on('exit', () => {
       console.log("Received some exit signal!");
       return Promise.resolve("A promise to be waited on before dying");
    });

Graceful.on('exit', (done) => {
       console.log("Another listener");
       done();
    });

// remove all listener
Graceful.clear('exit');

// removes ALL listeners of ALL signals
// Graceful.clear();
```

### Graceful.exit({Number} \[code], {String} \[signal])

Trigger graceful process exit.
This method is meant to be a substitute command for `process.exit()`
to allow other modules to exit gracefully in case of error.

- `code` - (optional) exit code to be used. default - `process.exitCode`
- `signal` - (optional) signal to be simulating for listeners. default - `SIGTERM`

##### example
```javascript

server.listen(3333)
        .on('listening', function () {
            console.log('Yay!')
        })
        .on('error', function (err) {
            if (err.code === 'EADDRINUSE') {
                console.error("Damn, Port is already in use...");
                Graceful.exit();
            }
        });

// exit code and signal can be specified
// Graceful.exit(1, 'SIGINT')
```

## Options

Options are global and shared, any change will override previous values.

#### Graceful.exitOnDouble = true {Boolean}

Whether to exit immediately when a second deadly event is received,
For example when Ctrl-C is pressed twice etc..
When exiting due to double event, exit code will be `process.exitCode` or `1` (necessarily a non-zero)

#### Graceful.timeout = 30000 {Number}

Maximum time to wait for exit listeners in `ms`.
After exceeding the time, the process will force exit
and the exit code will be `process.exitCode` or `1` (necessarily a non-zero)

Setting the timeout to `0` will disable timeout functionality (will wait indefinitely)

#### exitCode

Graceful will obey process.exitCode property value when exiting
apart from forced exit cases where the exit code must be non-zero.
