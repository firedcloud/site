fs = require 'fs'
ffs = require '../../lib'
$ = require '../../lib/attributes'
{all, pipeline} = require 'pinky-combinators'


describe 'λ status' ->
  o 'Should return a Stats object for the file node.' ->
     expect ($.status 'root') .to.eventually.be.an.instanceof fs.Stats


describe 'λ link-status' ->
  o 'Should return a Stats object for the node.' ->
     expect ($.link-status 'root/bin/l') .to.eventually.be.an.instanceof fs.Stats


describe 'λ is-file' ->
  o 'Should be eventually true if node is a file.' ->
     expect ($.is-file 'root/bin/ls') .to.become true

  o 'Should be eventually false if node isnt a file.' ->
     expect ($.is-file 'root/bin') .to.become false

  o 'Should be eventually true if node is a link to a file.' ->
     expect ($.is-file 'root/bin/l') .to.become true


describe 'λ is-directory' ->
  o 'Should be eventually true if node is a directory.' ->
     expect ($.is-directory 'root/bin') .to.become true

  o 'Should be eventually false if node isnt a directory.' ->
     expect ($.is-directory 'root/bin/ls') .to.become false

  o 'Should be eventually true if node is a link to a directory.' ->
     expect ($.is-directory 'root/home/user1/bin') .to.become true


describe 'λ change-owner' ->
  o 'Should change the owner of a single file.'


describe 'λ change-link-owner' ->
  o 'Should change the owner of a file, without dereferencing.'


describe 'λ change-owner-recursive' ->
  o 'Should change the owner of all files within a path.'


describe 'λ change-mode' ->
  o 'Should change the mode of the file.' ->
     change = -> $.change-mode 8~700, 'root/bin/cp'
     mode   = -> ($.status 'root/bin/cp').then (-> it.mode .&. 8~700)
     check  = -> expect (mode!) .to.become 8~700

     pipeline [ change, check ]

# Only available on Mac OS/X
xdescribe 'λ change-link-mode' ->
  o 'Should change the mode of the link.' ->
     change = -> $.change-link-mode 8~700, 'root/bin/l'
     mode   = -> ($.link-status 'root/bin/cp').then (-> it.mode .&. 8~700)
     check  = -> expect (mode!) .to.become 8~700

     pipeline [change, check]

describe 'λ change-mode-recursive' ->
  o 'Should change the mode of everything in a directory.' ->
     debugger
     change         = -> $.change-mode-recursive 8~700, 'root/etc'
     mode           = -> ($.status it) .then -> it.mode .&. 8~700
     status         = -> all (it.map mode)
     files          = ffs.list-recursive 'root/etc'
     expected-modes = files.then (-> it.map (-> 8~700))
     check          = -> expected-modes.then ->
                          (expect (files.then status) .to.become it)

     pipeline [change, check]
