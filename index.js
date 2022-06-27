const cheerio = require("cheerio");
const request = require("request");
const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const port = 3002;
const server_ip = "0.0.0.0";
// serve images from the url
app.use(express.static(path.join(__dirname, "static_local")));

app.get("/", (_req, res) => {
  const url = "https://www.google.com/";
  request(url, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      res.send(html);
    }
  });
});
app.get("/search", (req, res) => {
    // mask the request as google chrome browser
    const useragnent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.3112.113 Safari/537.36";


  const url = "https://www.google.com/search?q=" + req.query.q;
  async function getHTML() {
    // using the useragent
    const options = {
        url: url,
        headers: {
            "User-Agent": useragnent
        }
    };
    const response = await fetch(url);
    const html = await response.text();
    return html;
  }
    getHTML().then(html => {
        res.send(html);
        }
    );
});

app.listen(port, () => {
  console.log(`Example app listening at http://${server_ip}:${port}`);
});
