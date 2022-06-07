(require 'mocha-as-promised')!

path = require 'path'
chai = require 'chai'
chai.use (require 'chai-as-promised')

global.o      = it
global.expect = chai.expect
process.chdir (path.resolve __dirname, 'fixtures')

describe '{} Attributes' ->
  require './unit/attributes'

describe '{} Directory' ->
  require './unit/directory'

describe '{} File' ->
  require './unit/file'

describe '{} Path' ->
  require './unit/path'