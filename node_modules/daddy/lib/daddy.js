import check                  from 'check-types';
import PermissionLayer        from './permission-layer';
import PermissionTestResult   from './permission-test-result';

let hastobe   = check.assert,
    _Promise  = Promise;


/**
 * Daddy constructor
 *
 * @param {Boolean} mad   If mad, will deny unknown permissions.
 */
export default function Daddy(mad) {

  if (mad) {
    hastobe.boolean(mad);
  }

  let _permissions          = [],
      _lookupTable          = {},
      _lookupCache          = {},
      _defaultParamsGetter  = () => [],
      _mad                  = !!mad;


  /**
   * Finds all satisfying permission layers, or an already cached list.
   * 
   * @param   {String} name
   * @return  {Array}
   */
  let _parsePermissionLayers = function(name) {

    let cachedIndices = _lookupCache[name],

        matches       = !!cachedIndices
                        ? cachedIndices.map(
                            function(index) {
                              return _permissions[index];
                            }
                          )
                        : _permissions.filter(
                            function(permission) {
                              return !!permission.match(name);
                            }
                          );

    // cache fresh and matching lookups
    if (matches.length && !cachedIndices) {
      _lookupCache[name] =  matches.map(function(permission){
                              return _lookupTable[permission.toString()]
                            });
    }

    return matches;
  };

  /**
   * A convenience wrapper for results with no layers found.
   * Granted unless dad is mad.
   * 
   * @return {Object}
   */
  var _notFoundResult = function() {
    return new PermissionTestResult(!_mad, 'No permission layers matched.')
  };


  /**
   * Run each handler on each permission layer.
   * Short circuit if handler does not return true.
   * 
   * @param  {Array}  layers
   * @param  {any}    params
   * @return {Object}
   */
  var _performTest = function(layers, params) {
    
    let failingResult;

    let allPassed = layers.every(function(layer) {

      return layer.handlers().every(function(handler) {

        let pass = handler(...params);

        // every other value than explicit true is considered a failure
        if (pass !== true) {
          failingResult = new PermissionTestResult(false, pass);
          // short circuit
          return false;
        }

        return true;

      });

    });

    return !!allPassed
      ? new PermissionTestResult(true, 'All permissions granted.')
      : failingResult;

  };


  /**
   * Run handlers synchronously.
   * 
   * @param   {Array}   layers
   * @param   {any}     params
   * @return  {Object}  The test result object
   */
  var _syncTester = function(layers, params) {

    // unknown permissions are granted unless dad is mad
    if (!layers.length) {
      return _notFoundResult();
    }

    // just return the result
    return _performTest(layers, params);

  };


  /**
   * Run handlers asynchronously
   * 
   * @param   {Array}   layers
   * @param   {any}     params
   * @return  {Promise} A promise that resolves or rejects with a result object
   */
  var _asyncTester = function(layers, params) {

    // unknown permissions are granted unless dad is mad
    if (!layers.length) {
      let promiseMethod = !!_mad ? 'reject' : 'resolve';
      return _Promise[promiseMethod]( _notFoundResult() );
    }

    return new _Promise(function(resolve, reject) {
      
      let result = _performTest(layers, params);
      
      if (result.granted) {
        return resolve(result);
      }

      reject(result);

    });

  };


  /**
   * Get a desired check runner.
   * 
   * @param   {Function} tester
   * @return  {Function}
   */
  var _getCheckRunner = function(tester) {

    return function(name, ...params) {

      hastobe.string(name, '´name´ parameter must be a string');

      let layers  = _parsePermissionLayers(name);

      params = _defaultParamsGetter().concat(params);

      return tester(layers, params);

    };
    
  };


  /**
   * Adds a permission handler to a daddy instance
   * 
   * @param {(String|RegExp)} pattern
   * @param {[Function]}      handlers
   */
  this.permission = function(pattern, ...handlers) {
    
    hastobe
      .either.string(pattern)
      .or.instance(pattern, RegExp, 'A permission pattern must be string or regexp.');

    let regex           = check.string(pattern)
                          ? new RegExp('^' + pattern + '$')
                          : new RegExp(pattern),
        lookupTableKey  = regex.toString();

    hastobe.not.assigned( _lookupTable[lookupTableKey] );
    _lookupTable[lookupTableKey] = _permissions.length;

    _permissions.push(
      new PermissionLayer(regex, handlers)
    );

    return this;

  };


  /**
   * Run check synchronously. Returns the result.
   * 
   * @param   {String}  name
   * @param   {any}   params
   * @return  {Object}
   * @api     public
   */
  this.check = _getCheckRunner(_syncTester);


  /**
   * Run check asynchronously. Returns a promise resolving or rejecting with the result.
   *
   * @param   {String}  name
   * @param   {any}   params
   * @return  {Promise}
   * @api     public
   */
  this.when = _getCheckRunner(_asyncTester);


  /**
   * Register a param getter function in a daddy instance.
   * It set, will head its' return value in params passed to check.
   * This is especially useful for user authorization when you know for sure
   * that the current user is always needed in checks.
   * e.g ´daddy.setParamsGetter(getCurrentUser)´
   *
   * Note that you can also return multiple params as an array.
   *
   * @param {Function} fn
   */
  this.defineParamsGetter = function(fn) {

    hastobe.function(fn, 'Params getter must be a function');

    _defaultParamsGetter = !!check.array(fn())
                            ? fn
                            : function() {
                                return [fn()];
                              };

    return this;
  };


  /**
   * Define a promise implementation to be used in async checks.
   * Defaults to ES6 Promise.
   *
   * eg. var Promise = require('bluebird');
   *     Daddy.setPromiseImplementation(Promise);
   *     
   * Does not try to test if the passed implementation is correct.
   * Give it something odd and expect odd behaviour.
   * 
   * @param  {Promise} constructor
   * @return {Promise} instance of constructor, that resolves
   */
  this.setPromiseImplementation = function(promiseConstructor) {
    
    _Promise = promiseConstructor;

    return _Promise.resolve('Promise implementation changed');

  };

  return this;
}