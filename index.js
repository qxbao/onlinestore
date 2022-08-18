require('dotenv').config()
let {app,html,express} = require('./modules/server.js')
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


app.use(cookieParser(process.env.RANDOMKEY_COOKIE))

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

routerHandle(app)

const port = 80;
html.listen(port, (token) => {
    console.log("Server đang chạy trên port:",port);
});