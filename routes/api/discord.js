const { Router } = require('express');
const crypto = require('crypto');

const { UnprocessableEntity } = require('../../libraries/errors');
const { getToken, identifyUser, redirectURI, endpoint } = require('../../libraries/discord');
const { User, DiscordOAuth } = require('../../models');
const config = require('../../../media/config.json');

const router = Router();

function hash(text) {
	return crypto.createHash('md5').update(text).digest('hex');
}

router.get('/authorize', (req, res) => {
	const state = hash(req.sessionID);
	
	res.redirect(`${endpoint}/oauth2/authorize?client_id=${config.website.client_id}&redirect_uri=${encodeURIComponent(redirectURI)}&response_type=code&scope=identify%20guilds&prompt=none&state=${state}`);
});

router.get('/callback', async (req, res, next) => {
	if (!req.query.code) return next(new UnprocessableEntity('No code provided from Discord. '));
	if (!req.query.state) return next(new UnprocessableEntity('No state returned'));
	const state = hash(req.sessionID);
	if (state !== req.query.state) return next(new UnprocessableEntity('States returned do not match. That\'s not a good thing.'));
	
	const code = req.query.code;
	
	let body = await getToken(code, false).catch(next);
	let expiry = Date.now() + body.expires_in * 1000;
	
	let [ oAuth, created ] = await DiscordOAuth.findOrCreate({
		where: { accessToken: body.access_token, refreshToken: body.refresh_token }, 
		defaults: { accessTokenExpiry: expiry }
	});
	
	if (created) {
		req.session.userID = await identifyAndCreateUser(oAuth).catch(next);
	} else {
		let [, user] = await Promise.all([ oAuth.update({ accessTokenExpiry: expiry }), oAuth.getUser() ]);
		
		req.session.userID = user ? await user.get('discordID') : await identifyAndCreateUser(oAuth);
	}
	
	res.redirect('/');
});

/**
 * Identify user through the Discord API and create a User object with info
 * @param oAuth The DiscordOAuth object to assign to the user
 * @returns Promise<string> userID The user's Discord ID
 */
function identifyAndCreateUser(oAuth) {
	return new Promise(async (resolve, reject) => {
		let user = await identifyUser(oAuth).catch(reject);
		await User.createNew(user.id, user.username, user.discriminator, user.avatar, oAuth);
		return resolve(user.id);
	});
}

router.use((err, req, res, next) => {
	if (err.code && err.code >= 500) console.error(err);
	res.status(err.code || 500);

	if (req.accepts('html')) {
		res.render('message', {
			message: err.message || 'Internal Server Error',
			subMessage: 'Something broke on our end. Sorry \'bout that.'
		});
	}
});

module.exports = router;