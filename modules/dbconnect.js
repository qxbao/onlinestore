let mysql = require('mysql2');
var express = require('express');
var session = require('express-session');

let opt = {
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPWD,
    database: process.env.DBNAME
};

let db = mysql.createPool(opt);

module.exports = db,opt;