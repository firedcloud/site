## Module pinky-combinators
#
# Sweet combinators for promises/a+
#
#
# Copyright (c) 2013 Quildreen "Sorella" Motta <quildreen@gmail.com>
#
# Permission is hereby granted, free of charge, to any person
# obtaining a copy of this software and associated documentation files
# (the "Software"), to deal in the Software without restriction,
# including without limitation the rights to use, copy, modify, merge,
# publish, distribute, sublicense, and/or sell copies of the Software,
# and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
# LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
# WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### -- Dependencies ----------------------------------------------------
pinky = require 'pinky'


### -- Composition combinators -----------------------------------------

#### λ compose
# Like function composition, but for promises.
#
# :: [a | Promise a b] -> Promise a b
compose = (values) ->
  | values.length is 0 => pinky void
  | otherwise          => do
                          promise = pinky values.pop!!
                          i       = values.length

                          while i-- => promise = promise.then values[i]
                          return promise


#### λ pipeline
# Like compose, but from left to right.
#
# :: [a | Promise a b] -> Promise [a] b
pipeline = compose . (.reverse!)


### -- Promise aggregation / parallelism -------------------------------

#### λ all
# Returns a promise that is resolved when all other promises are.
#
# :: [a | Promise a b] -> Promise [a] b
all = (values) ->
  | values.length is 0 => return pinky []
  | otherwise          => do
                          result  = []
                          promise = pinky!
                          len     = values.length

                          values.map (a, i) -> (pinky a).then do
                            * fulfill-one i
                            * promise.reject

                          return promise

  function fulfill-one(index) => (value) ->
    result[index] = value
    if not --len => promise.fulfill result
    value


#### λ any
# Returns a promise that is resolved if any is.
#
# :: [a | Promise a b] -> Promise a b
any = (values) ->
  | values.length is 0 => pinky void
  | otherwise          => do
                          promise = pinky!
                          values.map -> (pinky it).then do
                            * promise.fulfill
                            * promise.reject

                          return promise



### -- Exports ---------------------------------------------------------
module.exports = { compose, pipeline, all, any }
