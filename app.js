const PRODUCTION = process.argv[2] !== 'dev';

const path = require('path');

const express = require('express');
const serveFavicon = require('serve-favicon');
const serveStatic = require('serve-static');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const moment = require('moment');

const config = require('../media/config');
const models = require('./models');
const apiRouter = require('./routes/api');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
if (PRODUCTION) app.set('trust proxy', 1);

// it's a helmet. it protects.
app.use(helmet());

// static files
app.use(serveFavicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'public'), { index: false, immutable: true, maxAge: '1w'}));

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
	secret: config.website.secrets.session,
	name: 'arthur.sid',
	store: new SequelizeStore({
		db: models.sequelize,
		table: 'Session',
		extendDefaultFields: (defaults, session) => {
			return {
				data: defaults.data,
				expires: defaults.expires,
				userID: session.userID
			};
		}
	}),
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: PRODUCTION,
		sameSite: 'lax',
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
}));

app.use((req, res, next) => { // logger/all requests
	let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if (ip === '::1') ip = 'localhost'; // localhost checker
	if (ip && ip.startsWith('::ffff:')) ip = ip.slice(7); // IPv6 checker
	let method = req.method;
	let path = req.originalUrl;

	console.info(`${moment().format('MM/DD/YY H:mm:ss')} -- ${method} request from ${ip} at ${path}`);
	console.log(req.session);
	next();
});

app.use('/api', apiRouter);

app.use((req, res) => {
	res.status(404);
	let path = req.originalUrl;

	if (req.accepts('html')) {
		res.render('message', {
			message: '404 Not Found',
			subMessage: `Could not find ${path}`
		});
		return;
	}

	if (req.accepts('json')) {
		res.send({ error: 'Not found, could not find ' + path });
		return;
	}

	res.type('txt').send('Not found, could not find ' + path);
});

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500);
	
	if (req.accepts('html')) {
		res.render('message', {
			message: '500 Internal Server Error',
			subMessage: 'Something broke on our end. Sorry \'bout that.'
		});
		return;
	}

	if (req.accepts('json')) {
		res.send({ error: 'Internal server error.' });
		return;
	}

	res.type('txt').send('500 - Internal server error');
});

models.sequelize.sync({ force: true }).then(() => { // remove force after testing
	app.listen(9001, () => { console.log('Server started on port 9001.') });
});