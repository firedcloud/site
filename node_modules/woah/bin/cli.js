#!/usr/bin/env node

'use strict';

const minimist = require('minimist');
const fs = require('fs');
const path = require('path');
const server = require('../lib/server');

const cwd = path.resolve('.');
const argv = minimist(process.argv.slice(2));
const entry = argv._[0] || path.join(cwd, 'index.js');

fs.access(entry, function(err) {
  if (err) {
    throw new Error(`Entry is not found: ${entry}`);
  }

  const port = argv.port || 3000;
  server(entry, port);
});
