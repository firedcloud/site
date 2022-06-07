/**
 *
 * @author Bichi Kim [bichi@pjfactory.com]
 * @copyright (c) PJ Factory Co.
 * @license Private
 */
module.exports = function(config){
  config.set({
    browsers: ['ChromeWithoutSecurity'],
    frameworks: ['mocha', 'chai'],
    reporters: ['spec'],
    files: [
      {pattern: '../src/**/*.spec.ts'},
    ],
    exclude: [],
    preprocessors: {
      '../src/**/*.ts': ['webpack', 'sourcemap'],
    },
    webpack: require('../build/webpack.test.conf.js'),
    webpackMiddleware: {
      noInfo: true,
    },
    logLevel: config.LOG_INFO,
    colors: true,
     customLaunchers: {
      ChromeWithoutSecurity: {
        base: 'Chrome',
        flags: ['--disable-web-security'],
      },
    },
    mime: {
      'text/x-typescript': ['ts'],
    },
  })
}
