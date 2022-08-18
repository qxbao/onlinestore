let express = require('express');
let app = express();
var html = require("http").Server(app)
var io = require('socket.io')(html);

app.set('socketio', io);
app.set('views', './public/pug')
app.set('view engine', 'pug')

module.exports = {io,app,html,express}