const cheerio = require("cheerio");
const express = require("express");
const app = express();
const port = 3002;
const server_ip = "0.0.0.0";



app.listen(port, server_ip, () => {
  console.log(`Server running at http://${server_ip}:${port}/`);
});
