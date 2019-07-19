const request = require('request');

const { InternalServerError } = require('./errors');
const config = require('../../media/config.json');

const redirectURI = (process.argv[2] === 'dev' ? `http://localhost:${config.website.port}` : config.website.hostname) + '/api/discord/callback';
const endpoint = 'https://discordapp.com/api/v6';

/**
 * Get a discord token and other associated information with a code or refresh token.
 * @param {String} code The code or refresh token being used to get a new token
 * @param {Boolean} refresh Whether or not `code` is a refresh token. Truthy values mean that it is.
 * @returns {Promise<Object>} body The JSON response from Discord
 */
function getToken(code, refresh) {
	return new Promise((resolve, reject) => {
		const options = {
			method: 'POST',
			url: endpoint + '/oauth2/token',
			form: {
				client_id: config.website.client_id,
				client_secret: config.website.secrets.discordClient,
				grant_type: 'authorization_code',
				redirect_uri: redirectURI,
				scope: 'identify guild'
			}
		};

		if (!refresh) options.form.code = code;
		else options.form.refresh_token = code;

		request(options, async (err, resp, body) => {
			if (err) return reject(new InternalServerError('Could not connect to Discord. Please try again later.', undefined, err));
			if (!body) return reject(new InternalServerError('Error getting response from Discord. Please try again later.', undefined));

			try {
				body = JSON.parse(body);
				return resolve(body);
			} catch (e) {
				return reject(new InternalServerError('Could not parse response from Discord. Please try again later.', undefined, e));
			}
		});
	});
}

/**
 * Send a request to the Discord API /users/@me to identify the user of an OAuth token.
 * @param {DiscordOAuth} oAuth The DiscordOAuth instance with a valid token to identify the user with.
 * @returns {Promise<Object>} body The body returned from Discord, including id, username, discrim, and more.
 */
function identifyUser(oAuth) {
	return new Promise(async (resolve, reject) => {
		const token = await oAuth.getValidToken().catch(reject);
		
		const options = {
			method: 'GET',
			uri: endpoint + '/users/@me',
			headers: {
				'User-Agent': `Arthur Discord Bot Website (${config.website.hostname}, 1.0)`,
				'Authorization': `Bearer ${token}`
			}
		};

		request(options, (err, resp, body) => {
			if (err) return reject(new InternalServerError('Could not connect to Discord. Please try again later.', undefined, err));
			if (!body) return reject(new InternalServerError('Error getting response from Discord. Please try again later.', undefined));

			try {
				body = JSON.parse(body);
				return resolve(body);
			} catch (e) {
				return reject(new InternalServerError('Could not parse response from Discord. Please try again later.', undefined, e));
			}
		});
	});
}

exports.getToken = getToken;
exports.identifyUser = identifyUser;
exports.redirectURI = redirectURI;
exports.endpoint = endpoint;