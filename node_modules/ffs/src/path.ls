## Module path #########################################################
#
# Path operations.
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
fs = require 'fs'
path = require 'path'

pinky = require 'pinky'
{lift-node} = require 'pinky-for-fun'
{status} = require './attributes'
{walk-tree} = require './utils'


### -- Core path routines ----------------------------------------------

#### λ exists
# Checks if the given path exists in the file system.
#
# :: String -> Promise Bool
exists = (path-name) ->
  promise = pinky!
  fs.exists path-name, promise.fulfill
  return promise


#### λ move
# Moves a node from one path to another.
#
# :: String -> String -> Promise ()
rename = lift-node fs.rename
move = (from, destination) --> rename from, destination


#### λ remove
# Removes one node.
#
# :: String -> Promise ()
unlink = lift-node fs.unlink
rmdir  = lift-node fs.rmdir
remove = (path-name) -> (status path-name) .then (node-info) ->
  | node-info.is-directory! => rmdir path-name
  | otherwise               => unlink path-name


#### λ remove-recursive
# Removes a node and all its children.
#
# :: String -> Promise ()
remove-recursive = (path-name) ->
  promise = pinky!

  (path-name |> walk-tree remove).then do
    * -> promise.fulfill!
    * promise.reject

  return promise



### -- Exports ---------------------------------------------------------
module.exports = { exists, move, remove, remove-recursive }
