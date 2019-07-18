const { getToken } = require('../libraries/discord');

const discordOAuth = (sequelize, DataTypes) => {
	let DiscordOAuth = sequelize.define('DiscordOAuth', {
		accessToken: {
			type: DataTypes.STRING,
			allowNull: false
		},
		accessTokenExpiry: {
			type: DataTypes.DATE,
			allowNull: false
		},
		refreshToken: DataTypes.STRING
	});
	
	DiscordOAuth.associate = models => {
		models.DiscordOAuth.belongsTo(models.User);
	};
	
	DiscordOAuth.createNew = (accessToken, accessTokenExpiry, refreshToken) => {
		return new Promise((resolve, reject) => {
			DiscordOAuth.create({
				accessToken, accessTokenExpiry, refreshToken
			}).then(resolve).catch(reject);
		});
	};
	
	DiscordOAuth.prototype.getValidToken = function () {
		let outerThis = this;
		
		return new Promise(async (resolve, reject) => {
			if (outerThis.accessTokenExpiry.getTime() - Date.now() > 5000) return resolve(outerThis.accessToken);

			let body = await getToken(outerThis.refreshToken, true).catch(reject);

			await outerThis.update({
				accessToken: body.access_token,
				refreshToken: body.refresh_token,
				accessTokenExpiry: Date.now() + body.expires_in * 1000
			});

			return resolve(body.access_token);
		});
	};
	
	return DiscordOAuth;
};

module.exports = discordOAuth;