(require 'mocha-as-promised')!
chai = require 'chai'
chai.use (require 'chai-as-promised')

global.expect = chai.expect
global.o      = it

require './promises-aplus'
require './pinky'