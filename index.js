const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3002;
const server_ip = "0.0.0.0";
// serve images from the url
app.use(express.static(path.join(__dirname, "static_local")));
app.get("/", (req, res) => {
  // read the file and sanitize the html
  const host_file = fs
    .readFileSync("./server_hostname.txt", "utf8")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");

  const css_test = fs.readFileSync(
    path.join(__dirname, "static_local/css/test.css"),
    "utf8"
  );
  // add the css to the html
  const $ =
    cheerio.load(`<html><head><style>${css_test}</style></head><body><div class="container">
    <div class="container-center"><div>Showing the hostname saved in the server:</div><br><br>
    <span>Hostname: </span><span class="hostname">${host_file}</span>
    </div>
        </div></body></html>`);
  return res.send($.html());
});
app.use(express.json());
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.post("/", urlencodedParser, (req, res) => {
  //setting new hostname
  if (req.body.hostname) {
    if (/[^a-zA-Zа-яА-Я0-9]/.test(req.body.hostname)) {
      return res.send("Only letters and numbers!");
    }
    if (req.body.hostname.length > 20) {
      return res.send("Too long!");
    }
    // if contains special characters then return error
    fs.writeFileSync("./server_hostname.txt", req.body.hostname);
    return res.send("Hostname set");
  } else {
    res.send("Something went wrong").end();
  }
});
app.get("/search", (req, res) => {
  async function scrape() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/`);
    const html = await page.content();
    await browser.close();
    return html;
  }
  scrape();
});
app.listen(port, () => {
  console.log(`Example app listening at http://${server_ip}:${port}`);
});
