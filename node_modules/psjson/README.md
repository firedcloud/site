psjson
======

Just simply converts output of a 'ps' command into JSON.

Installation
------------

    npm install psjson

Usage
-----

    var psjson = require('psjson');
    psjson.ps('ps -ea', function(err, json) {
      console.dir(json);
    });

If no command is specified, the command defaults to 'ps -eaf'.

