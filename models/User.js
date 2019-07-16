const user = (sequelize, DataTypes) => {
	let User = sequelize.define('User', {
		discordID: {
			type: DataTypes.STRING,
			allowNull: false
		},
		username: DataTypes.STRING,
		discriminator: DataTypes.STRING,
		avatar: DataTypes.STRING
	});
	
	User.associate = models => {
		models.User.hasOne(models.DiscordOAuth);
	};
	
	User.createNew = (discordID, username, discriminator, avatar, discordOAuth) => {
		return new Promise((resolve, reject) => {
			User.create({
				discordID, username, discriminator, avatar
			}).then(user => {
				user.setDiscordOAuth(discordOAuth);
				resolve(user);
			}).catch(reject);
		});
	};
	
	return User;
};

module.exports = user;