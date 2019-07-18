const { Router } = require('express');
const router = Router();

const discordAPI = require('./discord.js');

router.use('/discord', discordAPI);

router.use((req, res, next) => {
	let path = req.originalUrl;
	if (path.includes('discord')) next();
	
	res.status(404).json({code: 404, message: `Could not find ${path}.`});
});

router.use((err, req, res, next) => {
	if (err.isServer) console.log(err);
	
	if (process.argv[2] !== 'dev') delete err.stack;
	
	res.status(err.code || 500).json(err);
});

module.exports = router;