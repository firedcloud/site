$ = require '../../lib/file'
{pipeline} = require 'pinky-combinators'

as-text = $.read 'utf8'

describe 'λ read' ->
  o 'Should return the contents of the file.' ->
     expect (as-text 'root/etc/hostname') .to.become 'test\n'

describe 'λ write' ->
  o 'Should write data to a file.' ->
     pipeline [(-> $.write 'utf-8' 'root/etc/hostname' 'mana')
               (-> expect (as-text 'root/etc/hostname') .to.become 'mana')]

  o 'Should create the file if it doesnt exist.' ->
     pipeline [(-> $.write 'utf-8' 'root/etc/hosts' 'mana')
               (-> expect (as-text 'root/etc/hosts') .to.become 'mana')]

describe 'λ append' ->
  o 'Should write data to the end of a file.' ->
     pipeline [(-> $.append 'utf-8' 'root/etc/hostname' 'mana')
               (-> expect (as-text 'root/etc/hostname') .to.become 'manamana')]

  o 'Should create the file if it doesnt exist.' ->
     pipeline [(-> $.append 'utf-8' 'root/etc/hosts1' 'mana')
               (-> expect (as-text 'root/etc/hosts1') .to.become 'mana')]
