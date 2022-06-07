## Module pinky-for-fun
#
# Pinky wrappers for regular and asynchronous functions.
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
{all} = require 'pinky-combinators'


### -- Regular functions -----------------------------------------------

#### λ lift
# Lifts a regular function into a function yielding a Promise.
#
# :: (a... -> b) -> Promise a c... -> Promise b c
lift = (f) -> (...args) ->
  (all args) .then (as) -> f ...as


#### λ lift-node
# Lifts a Node-style function into a function yielding a Promise.
#
# :: (a..., ((Error c, b) -> ())) -> Promise a c... -> Promise b c
lift-node = (f) -> (...args) ->
  promise = pinky!
  (all args) .then (as) -> f ...as, (err, data) ->
                                                | err => promise.reject err
                                                | _   => promise.fulfill data
  return promise



### -- Exports ---------------------------------------------------------
module.exports = { lift, lift-node }
