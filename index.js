const dotenv = require('dotenv');
dotenv.config('.env'); //to load the .env file
const express = require('express');
const app = express();
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.DB_INT_HOST,
    user: process.env.DB_INT_USER,
    password: process.env.DB_INT_PASSWORD,
    database: process.env.DB_INT_NAME
}); // internal database connection for our enterprise VPN
const int_raid = require('./internal/rmt_raid_core.js')

