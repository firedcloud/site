ffs = require '../../lib'
$ = require '../../lib/directory'
{all, pipeline} = require 'pinky-combinators'

describe 'λ make' ->
  o 'It should create a directory at the desired location.' ->
     pipeline [(-> $.make 8~700 'root/dev')
               (-> expect (ffs.is-directory 'root/dev') .to.become true)]
  
  o 'It should fail if the directory exists.' ->
     expect ($.make 8~700 'root/bin') .to.be.rejected.with /EEXIST/

  o 'It should fail if parent directories are missing.' ->
     expect ($.make 8~700 'root/a/b/c') .to.be.rejected.with /ENOENT/

describe 'λ make-recursive' ->
  o 'It should create all directories in the path.' ->
     pipeline [(-> $.make-recursive 8~700 'root/c/b/a')
               (-> expect (ffs.is-directory 'root/c/b/a') .to.become true)]

  o 'It should succeed if the leaf already exists.' ->
     pipeline [(-> $.make-recursive 8~700 'root/c/b/a')
               (-> expect (ffs.is-directory 'root/c/b/a') .to.become true)]

describe 'λ list' ->
  o 'It should list all the files in a directory.' ->
     expect (($.list 'root/etc').then -> it.sort!) .to.become <[ hostname nothing var ]>

describe 'λ list-recursive' ->
  o 'It should list all files in a directory & subdirectories.' ->
     ex    = <[ root/etc/hostname
                root/etc/nothing
                root/etc/var
                root/etc/var/system.log
                root/etc/var/user.log ]>.sort!
     files = ($.list-recursive 'root/etc').then -> it.sort!
     expect files .to.become ex
