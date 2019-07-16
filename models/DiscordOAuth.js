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
	
	return DiscordOAuth;
};

module.exports = discordOAuth;