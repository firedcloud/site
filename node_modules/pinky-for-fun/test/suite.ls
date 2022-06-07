f = require '../lib'
o = it

pinky = require 'pinky'
(require 'mocha-as-promised')()
chai = require 'chai'
chai.use (require 'chai-as-promised')
{expect} = chai


describe 'Pinky for Fun' ->
  describe 'λ lift' ->
    o 'Should lift a regular function into a Promise yielding function.' ->
       add-p = f.lift (a, b) -> a + b
       expect (add-p 2, 3) .to.become 5

  describe 'λ lift-node' ->
    read-p = f.lift-node (n, f) ->
                                | n == 0 => f (new Error 'no u')
                                | _      => f void, n

    o 'Should succeed if no error is passed to the callback.' ->
       expect (read-p 1) .to.become 1

    o 'Should fail if an error is passed to the callback.' ->
       expect (read-p 0) .to.be.rejected.with /no u/
