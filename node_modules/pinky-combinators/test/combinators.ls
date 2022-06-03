c = require '../lib'
o = it

pinky = require 'pinky'
(require 'mocha-as-promised')()
chai = require 'chai'
chai.use (require 'chai-as-promised')
{expect} = chai

s = -> 'a'
f = -> throw new Error 'no u'

delay = (n, f) ->
  p = pinky!then f
  set-timeout (-> p.fulfill!), n
  return p

describe 'Pinky combinators' ->
  describe 'λ compose' ->
    o 'Should treat an empty list as fulfilled.' ->
       expect (c.compose []) .to.be.fulfilled

    o 'Should pipe values from right to left.' ->
       p = (c.compose [(+ 2), (+ 1), (-> 0)])
       expect p .to.become 3

    o 'Should fail as soon as one fails.' ->
       p = (c.compose [s, f, s])
       expect p .to.be.rejected.with /no u/

  describe 'λ pipeline' ->
    o 'Should treat an empty list as fulfilled.' ->
       expect (c.pipeline []) .to.be.fulfilled

    o 'Should pipe values from left to right.' ->
       p = (c.pipeline [(-> 0), (+ 1), (+ 2)])
       expect p .to.become 3

    o 'Should fail as soon as one fails.' ->
       p = (c.pipeline [s, f, s])
       expect p .to.be.rejected.with /no u/


  describe 'λ all' ->
    o 'Should treat an empty list as resolved.' ->
       expect (c.all []) .to.be.fulfilled

    o 'Should resolve to a list of all promise values.' ->
       p = (c.all [(pinky 'a'), (pinky 'b'), (pinky 'c')])
       expect p .to.become <[ a b c ]>

    o 'Should resolve to a list of all promise values (regular values).' ->
       p = (c.all <[ a b c ]>)
       expect p .to.become <[ a b c ]>

    o 'Should fail as soon as one fails.' ->
       x = pinky 'a'
       p = c.all [(x.then s), (x.then f), (x.then s)]
       expect p .to.be.rejected.with /no u/

  describe 'λ any' ->
    o 'Should treat an empty list as fulfilled.' ->
       expect (c.any []) .to.be.fulfilled

    o 'Should succeed as soon as any succeeds.' ->
       x = pinky 'a'
       p = c.any [(x.then s), (delay 10, (x.then f))]
       expect p .to.become 'a'

    o 'Should fail as soon as any fails.' ->
       x = pinky 'a'
       p = c.any [(delay 10, (x.then s)), (x.then f)]
       expect p .to.be.rejected.with /no u/
