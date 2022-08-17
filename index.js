require('dotenv').config()
let express = require('express');
let app = express();
let bodyParser = require('body-parser')
let session = require('express-session')
let MySQLStore = require('express-mysql-session')(session);
let routerHandle = require('./routers/routerHandle.js')
let cookieParser = require('cookie-parser')

let sessionStore = new MySQLStore({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPWD,
    database: process.env.DBNAME
});

app.use(session({
	key: 'login_session',
	secret: process.env.RANDOMKEY,
    store: sessionStore,
	resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 1000*60*60*24*31}
}));


app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('views', './public/pug')
app.set('view engine', 'pug')
app.use(express.static(__dirname + '/public'));

routerHandle(app)

const port = 80;
app.listen(port, (req, res) => {
    console.log("Server đang chạy trên cổng", port)
});