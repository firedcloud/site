/**
 * Module dependencies
 */

var assert = require('assert');

/**
 * Expose 'foyer'
 */

module.exports = foyer;

/**
 * Foyer
 *
 * @param {Function[]} tasks
 * @param {Function} cb
 * @api public
 */

function foyer(tasks, cb) {
  assert('[object Array]' == Object.prototype.toString.call(tasks), 'Tasks must be an array of functions');
  assert('function' == typeof cb, 'Callback must be a function');
  var done = false;
  var results = [];
  var errors = [];
  var index = 0;

  function next() {
    var i = index++;
    var fn = tasks[i];
    
    if (!fn) return;
    fn.call(this, callback);

    function callback(err, res) {
      if (done) return;
      if (res) results[i] = res;
      if (err) errors[i] = err;
      if (index == tasks.length) cb(errors, results);
    }
  }
  // start async functions
  tasks.forEach(function() {
    next.call(this);
  }.bind(this));

  return this;
}