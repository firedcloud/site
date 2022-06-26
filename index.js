const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const port = 3002;
const server_ip = '0.0.0.0'
app.get('/', (req, res) => {
    res.send('Hello World!');
    }
);

app.listen(port, () => {
    console.log(`Example app listening at http://${server_ip}:${port}`);
}
);