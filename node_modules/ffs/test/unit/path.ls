$ = require '../../lib/path'
{all,pipeline} = require 'pinky-combinators'


describe 'λ exists' ->
  o 'Should eventually be true if the thing exists.' ->
     a = all [($.exists 'root/bin'), ($.exists 'root/etc/hostname')]
     expect a .to.become [true, true]

  o 'Should eventually be false if the thing doesnt exist.' ->
     expect ($.exists 'root/no') .to.become false


describe 'λ move' ->
  o 'Should move something from a path to another.' ->
     pipeline [(-> $.move 'root/lib1', 'root/usr')
              ,(-> expect (all [($.exists 'root/lib1'),($.exists 'root/usr')]) .to.become [false,true])]


describe 'λ remove' ->
  o 'Should delete the thing (directory).' ->
     pipeline [(-> $.remove 'root/dev')
               (-> expect ($.exists 'root/dev') .to.become false)]

  o 'Should delete the thing (file).' ->
     pipeline [(-> $.remove 'root/bin/rm')
               (-> expect ($.exists 'root/bin/rm') .to.become false)]

  o 'Should fail removing non-empty directories.' ->
     expect ($.remove 'root/usr') .to.be.rejected.with /ENOTEMPTY/


describe 'λ remove-recursive' ->
  o 'Should delete the directory and all its contents.' ->
     pipeline [(-> $.remove-recursive 'root/etc')
               (-> expect ($.exists 'root/etc') .to.become false)]
