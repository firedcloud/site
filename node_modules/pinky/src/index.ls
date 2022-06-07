## Module pinky
#
# Sweetly small promises/a+ implementation.
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

### -- Interfaces ------------------------------------------------------

#### type Thenable a b
# Something that might look like a Promise, but might not be quite a
# pinky Promise. We can likely interoperate with those, however.
#
# :: { "then" :: (a -> c), (b -> d) -> Thenable c d }

#### type Value a b
# The type of values a promise function accepts.
#
# :: Thenable a b | a | b

#### type Applicator
# The type of things that can apply promises.
#
# :: Value, (a -> Value), (b -> Value), Promise a b -> ()

### -- Helpers ---------------------------------------------------------

#### λ defer
# Defers the evaluation of a function to the next event loop.
#
# We currently support the Node.js platform and things that comply with
# the DOM interfaces. `setImmediate` is the equivalent of
# `process.nextTick` for IE, but unlikely to be implemented
# everywhere. Community is shimming it away anyways so it might become
# de-facto standard (the spec is madness though).
#
# :: Fun -> ()
defer =
  | set-immediate? => set-immediate
  | process?       => process.next-tick
  | otherwise      => (-> set-timeout it, 0)


#### λ is-thenable
# Checks if something matches the `Thenable` interface.
# 
# :: a -> Bool
is-thenable = (a) -> if a => typeof a.then is 'function'


#### λ is-function
# Checks if something belongs to the `Function` type.
#
# :: a -> Bool
is-function = (a) -> typeof a is 'function'


#### λ make-promise-from-thenable
# Constructs a brand-new Pinky promise from a `Thenable` object.
# 
# :: Thenable a b -> Promise a b
make-promise-from-thenable = (a) ->
  p = pinky-promise!
  a.then p.fulfill, p.reject
  return p


#### λ make-bindings
# Constructs binding applicators for a promise.
#
# :: (a -> Value), (b -> Value), Promise a b -> Applicator, Value -> ()
make-bindings = (fulfilled, failed, promise) -> (apply, value) ->
  apply value, fulfilled, failed, promise

#### λ to-fulfilled
# Applies bindings for a fulfilled state.
#
# :: Applicator
to-fulfilled = (value, fulfilled, _, promise) ->
  apply-promise value, fulfilled, promise.fulfill, promise

#### λ to-rejected
# Applies bindings for a rejected state.
#
# :: Applicator
to-rejected = (value, _, rejected, promise) ->
  apply-promise value, rejected, promise.reject, promise

### λ apply-promise
# Applies the state of a Promise.
#
# Since we have to wrap the thing in a try..catch block to get exception
# handling in promises and stuff, the code that actually attempts to
# apply a promise is moved to a separate function, so JITs can try to
# optimise that instead and we pay less overhead for the whole thing.
#
# § 3.2.6 at http://promises-aplus.github.com/promises-spec/
#
# :: Value -> (a | b -> Value), (Value -> ()), Promise a b -> ()
apply-promise = (value, handler, fallback, promise) ->
  try
    attempt-application value, handler, fallback, promise
  catch e
    promise.reject e

# Moves this thing off the try..catch block so JITs can optimise it.
attempt-application = (value, handler, fallback, promise) ->
  if is-function handler
    result = handler value
    if is-thenable result => result.then promise.fulfill, promise.reject
    else                  => promise.fulfill result
  # The handler is just another regular JS value
  else
    fallback value



### -- Core implementation ---------------------------------------------

#### λ promise
# Lifts a value into a Promise.
#
# :: a -> Promise a b
# :: Thenable a b -> Promise a b
pinky-promise = (a) ->
  # :: (a -> Value), (b -> Value), Promise a b -> ()
  add-bindings = (fulfilled, failed, promise) ->
    pending.push (make-bindings fulfilled, failed, promise)

  # ---
  return switch
    | is-thenable a    => make-promise-from-thenable a
    | arguments.length => pinky-promise!fulfill a
    | otherwise        => do
                          pending = []
                          
                          then      : add-transition-state
                          always    : (f) -> add-transition-state f, f
                          otherwise : (f) -> add-transition-state void, f
                          fulfill   : fulfill
                          reject    : fail
  # ---

  # Returns a new Promise that represents the eventual transformation
  # of the original promise's value through the given callbacks.
  #
  # § 3.2 at http://promises-aplus.github.com/promises-spec/
  #
  # :: (a -> Value), (b -> Value) -> Promise a b
  function add-transition-state(fulfilled, failed)
    p2 = pinky-promise!
    add-bindings fulfilled, failed, p2
    return p2

  # :: Applicator, Value -> ()
  function transition(state, value)
    let xs = pending => defer !-> for f in xs => f state, value

    # Since the promise ain't pending anymore, we can just apply the
    # values immediately to any subsequent call to `then`.
    add-bindings := (k, f, p) -> defer (-> (make-bindings k, f, p) state, value)
    pending      := []
    return void

  # :: Value -> Promise a b
  function fulfill(a) => do
                         transition to-fulfilled, a
                         this
  function fail(a)    => do
                         transition to-rejected, a
                         this



### -- Exports ---------------------------------------------------------
module.exports = pinky-promise
