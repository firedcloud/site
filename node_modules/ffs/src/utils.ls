## Module utils ########################################################
#
# A bag of utilities for applying functions to FS nodes.
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
fs   = require 'fs'
path = require 'path'

pinky           = require 'pinky'
{lift-node}     = require 'pinky-for-fun'
{pipeline, all} = require 'pinky-combinators'


### -- Helpers ---------------------------------------------------------
list   = lift-node fs.readdir
status = lift-node fs.stat


### -- Recursiveness ---------------------------------------------------

#### λ walk-tree
# Recursively applies a function to all nodes within a path.
#
# :: (String -> Promise a) -> String -> Promise [a]
walk-tree = (stepper, path-name) -->
  return (status path-name).then (info) ->
                                        | info.is-directory! => dive-in!
                                        | otherwise          => stepper path-name

  # keeps recursing through a directory.
  function dive-in()
    keep-stepping = walk-tree stepper
    files         = list path-name
    step-files    = -> files.then (xs) -> all (xs.map (keep-stepping . fix-path))
    return pipeline [ step-files, (-> stepper path-name) ]

  # adds the current relative path to the file name.
  function fix-path(file-name) => path.join path-name, file-name



### -- Exports ---------------------------------------------------------
module.exports = { walk-tree }
