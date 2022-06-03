![intro](./img/intro.png)

![typescript][typescript]

[typescript]:https://img.shields.io/badge/typescript-2.6.*-blue.svg


# [Tic - tok](https://www.youtube.com/watch?v=iP6XpLQM2Cs)

> Tic Tok, on the clock

> But the processor dosen't stop no

> Woah-oh oh oh~ Woah-oh oh oh~

## Install
``
npm install --save tiktok
``

## How to use
````javascript
/**
 *
 * @author Bichi Kim [bichi@pjfactory.com]
 * @copyright (c) PJ Factory Co.
 * @license Private
 */
require('babel-polyfill')
const {Run, Loop, Step} = require('../dist/app.js')
const runners = [
  (a) => {
    return new Promise((resolve, reject) => {
      resolve(a)
    })
  },
  (a) => {
    return new Promise((resolve, reject) => {
      resolve(a)
    })
  },
  (a) => {
    return new Promise((resolve, reject) => {
      resolve(a)
    })
  },
]
const runners2 = [
  (a) => {
    return new Promise((resolve, reject) => {
      resolve(`next ${a}`)
    })
  },
  (a) => {
    return new Promise((resolve, reject) => {
      resolve(`next ${a}`)
    })
  },
  (a) => {
    return new Promise((resolve, reject) => {
      resolve(`next ${a}`)
    })
  },
]
const run = new Run(runners, 'foo')
run.start()
run.then((a) => {
  console.log(a)
}).catch((error) => {
  console.log('--', error)
})

const loop = new Loop(runners, 'bar')
loop.delay(500)

loop.then((a) => {
  console.log(a)
}).catch((error) => {
  console.log('----', error)
})

loop.stopAfter(7, () => {
  console.log('stoped')
})
loop.start()
const step = new Step(runners, 'con')
step.then((a) => {
  console.log(a)
}).catch((error) => {
  console.log(error)
})
step.start()

setTimeout(() => {
  step.addAll(runners2, 'com')
}, 5000)

setTimeout(() => {
  step.addAll(runners2, 'cyn')
}, 3000)

setTimeout(() => {
  step.addAll(runners2, 'can')
}, 2000)

````

## Documents
``
``
