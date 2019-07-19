const { Router } = require('express');
const router = Router();

const discordAPI = require('./discord.js');
const { NotFound } = require('../../libraries/errors');
const { Referral } = require('../../models');
const config = require('../../../media/config.json');

router.use('/discord', discordAPI);

router.get('/guildadd', async (req, res) => {
	res.redirect('/thanks');
	
	let obj = {
		name: req.query.ref
	};
	
	switch (req.query.ref) {
		case 'discordbots.org':
			obj.url = 'https://discordbots.org/bot/329085343800229889';
			break;
		case 'discord.bots.gg':
			obj.url = 'https://discord.bots.gg/bots/329085343800229889';
			break;
		case 'discord':
			obj.url = 'https://discordapp.com';
			break;
		case 'github':
			obj.url = 'https://github.com/Gymnophoria/Arthur';
			break;
		case 'website':
			obj.url = config.website.hostname;
			break;
		case 'bots.ondiscord.xyz':
			obj.url = 'https://bots.ondiscord.xyz/bots/329085343800229889';
			break;
		case 'discordbotlist.com':
			obj.url = 'https://discordbotlist.com/bots/329085343800229889';
			break;
		default:
			obj.name = 'other';
			break;
	}
	
	let [referral, created] = await Referral.findOrCreate({
		where: { name: obj.name },
		defaults: { count: 1, URL: obj.url }
	});
	
	if (!created) await referral.update({
		count: ++referral.count
	});
});

// 404 handler
router.use((req, res, next) => {
	let path = req.originalUrl;
	if (path.includes('discord')) next();
	
	next(new NotFound(`Could not find ${path}.`));
});

// error handler
router.use((err, req, res, next) => {
	if (err.isServer) err._err ? console.error(err.message + '\n' + err._err) : console.log(err);
	
	if (process.argv[2] !== 'dev') delete err.stack;
	
	res.status(err.code || 500).json(err);
});

module.exports = router;