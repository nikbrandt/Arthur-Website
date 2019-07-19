const referral = (sequelize, DataTypes) => {
	let Referral = sequelize.define('Referral', {
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		count: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			defaultValue: 0
		},
		URL: {
			type: DataTypes.STRING
		}
	});
	
	Referral.createNew = (name, count, url) => {
		return Referral.create({ name, count, URL: url });
	};
	
	return Referral;
};

module.exports = referral;