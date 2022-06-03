'use strict';

const http = require('http');

const html = require('./html');
const build = require('./build');

module.exports = function(entry, port) {
  console.log('Woah dude...');

  build(entry).then(code => {
    const server = http.createServer((req, res) => {
      if (req.url === '/') {
        return res.end(html(code));
      }

      res.end('nothing');
    });
  
    server.listen(port, function() {
      console.log(`Serving ${entry} at http://localhost:${port}/`);
    });
  });  
};
