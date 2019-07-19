const fs = require('fs');
const path = require('path');

const Sequelize = require('sequelize');

const basename = path.basename(__filename);
let db = {};

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: path.join(__dirname, '..', '..', 'media', 'website-db.sqlite')/*,
	logging: true*/,
	transactionType: 'IMMEDIATE'
});

fs.readdirSync(__dirname).filter(file => {
	return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
}).forEach(file => {
	let model = sequelize.import(path.join(__dirname, file));
	db[model.name] = model;
});

Object.keys(db).forEach(model => {
	if (db[model].associate) db[model].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;