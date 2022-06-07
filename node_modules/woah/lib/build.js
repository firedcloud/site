'use strict';

const path = require('path');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');

module.exports = function(entry) {
  return new Promise(resolve => {
    const inputOptions = {
      input: path.resolve(__dirname, './start.js'),
      plugins: plugins(entry)
    };

    const outputOptions = {
      format: 'iife'
    };

    rollup.rollup(inputOptions).then(bundle => {
      bundle.generate(outputOptions).then(({ code }) => {
        resolve(code);
      });
    });
  });
};

function plugins(entry) {
  return [
    aliasEntry(entry),
    provideVendors(),
    babel({
      ignore: 'node_modules/**',
      presets: [
        [
          require.resolve('babel-preset-env'),
          {
            modules: false
          }
        ],
        require.resolve('babel-preset-stage-0'),
        require.resolve('babel-preset-react')
      ],
      plugins: [
        require.resolve('babel-plugin-external-helpers')
      ]
    }),
    commonjs(),
    resolve({
      browser: true
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ];
}

function aliasEntry(entry) {
  return {
    resolveId(importee) {
      if (importee === '__entry__') {
        return entry;
      }
    }
  };
}

function provideVendors() {
  return {
    resolveId(importee) {
      if (importee === 'react') {
        return require.resolve('react');
      }
    }
  };
}
