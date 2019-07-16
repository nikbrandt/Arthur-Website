const session = (sequelize, DataTypes) => {
	return sequelize.define('Session', {
		sid: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		userID: DataTypes.STRING,
		expires: DataTypes.DATE,
		data: DataTypes.STRING(50000)
	});
};

module.exports = session;