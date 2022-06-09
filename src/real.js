const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("./config/database");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const passport = require("passport");
// using .env
require("dotenv").config();
const DB = process.env.DB;
const mongoURI = process.env.MONGODB_URI;
const mongoUser = process.env.MONGODB_USER;
const mongoPass = process.env.MONGODB_PASS;
const mongoDB = process.env.MONGODB_DB;
const mongoPort = process.env.MONGODB_PORT;
const mongoHost = process.env.MONGODB_HOST;
const password = process.env.DB_PASSWORD;
const user = process.env.DB_USER;
const host = process.env.DB_HOST;
const int_port_vpn = process.env.DB_PORT;
const db = process.env.DB_NAME;
import * as sanitizeHtml from "sanitize-html";
const secret = "c54cn608708n^&&&!)R$!-3m0x58y9kjv9iii";
app.use(
  session({
    secret: "totallysecret",
    resave: true,
    saveUninitialized: true,
  })
);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.post("/", sanitizeHtml, (req, res) => {
  if (req.body.name) {
    res.send(sanitizeHtml("Hello " + req.body.name));
    if (req.body.name == "admin") {
      res.send("Hello " + req.body.name);
      if (app.get("env") === "development") {
        res.send("Hello " + req.body.name);
      } else if (app.get("env") === "production") {
        res.send("Hello " + req.body.name);
      } else {
        res.send("Hello " + req.body.name);
      }
    }
  } else {
    res.send("Hello World!");
    if (req.body.name == "admin") {
      res.send("Hello " + req.body.name);
      if (req.body.name == "bad_admin") {
        res.send("bye ass " + req.body.name);
      }
    }
  }
});
