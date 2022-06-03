import check from 'check-types';

let hastobe = check.assert;


/**
 * Permission
 * 
 * @param {String|RegExp} name
 * @param {array}         handlers
 */
export default function PermissionLayer(regex, handlers) {

  hastobe.instance(regex, RegExp, 'regex must be a valid RegExp object');

  var _handlers = handlers
                  .filter(function(x) {
                    hastobe.function(x, 'PermissionLayer handlers must be functions.');
                    return check.function(x);
                  }),

      _regex    = regex;

  hastobe.not.length(_handlers, 0, 'A permission rule must have at least one handler.');

  /**
   * Match a string against this permissions' regex
   * 
   * @param  {String} str
   * @return {Array}  RegExp match
   */
  this.match = function(str) {
    hastobe.string(str);
    return _regex.exec(str);
  };

  /**
   * Returns _regex as a string
   * 
   * @return {String}
   */
  this.toString = function() {
    return _regex.toString();
  };

  /**
   * Returns this permissions' handlers
   * @return {Array}
   */
  this.handlers = function() {
    return _handlers;
  };

  return this;
};
