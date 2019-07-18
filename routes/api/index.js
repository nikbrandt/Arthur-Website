const { Router } = require('express');
const router = Router();

const discordAPI = require('./discord.js');
const { NotFound } = require('../../libraries/errors');

router.use('/discord', discordAPI);

router.use((req, res, next) => {
	let path = req.originalUrl;
	if (path.includes('discord')) next();
	
	next(new NotFound(`Could not find ${path}.`))
});

router.use((err, req, res, next) => {
	if (err.isServer) err._err ? console.error(err.message + '\n' + err._err) : console.log(err);
	
	if (process.argv[2] !== 'dev') delete err.stack;
	
	res.status(err.code || 500).json(err);
});

module.exports = router;