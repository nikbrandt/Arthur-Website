const { Router } = require('express');
const crypto = require('crypto');
const request = require('request');

const models = require('../../models');
const config = require('../../../media/config.json');
const redirectURI = (process.argv[2] === 'dev' ? `http://localhost:${config.website.port}` : config.website.hostname) + '/api/discord/callback';
const api = 'https://discordapp.com/api/v6';

const router = Router();

// TODO: Implement Discord OAuth2 API here

function hash(text) {
	return crypto.createHash('md5').update(text).digest('hex');
}

router.get('/authorize', (req, res) => {
	const state = hash(req.sessionID);
	res.redirect(`${api}/oauth2/authorize?client_id=${config.website.client_id}&redirect_uri=${encodeURIComponent(redirectURI)}&response_type=code&scope=identify%20guilds&prompt=none&state=${state}`);
});

router.get('/callback', (req, res, next) => {
	if (!req.query.code) throw new Error('No code provided');
	if (!req.query.state) throw new Error('No state returned');
	const state = hash(req.sessionID);
	if (state !== req.query.state) throw new Error('States returned do not match.');
	
	const code = req.query.code;
	
	const options = {
		method: 'POST',
		url: api + '/oauth2/token',
		form: {
			client_id: config.website.client_id,
			client_secret: config.website.secrets.discordClient,
			grant_type: 'authorization_code',
			code: code,
			redirect_uri: redirectURI,
			scope: 'identify guild'
		}
	};
	
	request(options, async (err, resp, body) => {
		if (err) return next(err); // TODO: Differentiate between public errors and internal errors (e.g. this is internal)
		
		if (!body) return next('Could not get discord JSON body for token');
		
		try {
			body = JSON.parse(body);
		} catch (e) {
			return next(e);
		}
		
		console.log(body);

		let oAuth = await models.DiscordOAuth.createNew(body.access_token, Date.now() + body.expires_in * 1000, body.refresh_token);
		
		identifyUser(oAuth).then(async user => {
			console.log(user);
			
			let userModel = await models.User.createNew(user.id, user.username, user.discriminator, user.avatar, oAuth);
			req.session.userID = user.id;

			res.redirect('/');
		}).catch(next);
	});
});

function identifyUser(oAuth) {
	return new Promise((resolve, reject) => {
		const options = {
			method: 'GET',
			uri: api + '/users/@me',
			headers: {
				'User-Agent': `Arthur Discord Bot Website (${config.website.hostname}, 1.0)`,
				'Authorization': `Bearer ${oAuth.get('accessToken')}`
			}
		};

		request(options, (err, resp, body) => {
			if (err) return reject(err);
			if (!body) return reject('No discord API body');
			
			try {
				body = JSON.parse(body);
				return resolve(body);
			} catch (e) {
				return reject(e);
			}
		});
	});
}

module.exports = router;