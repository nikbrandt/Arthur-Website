const { Router } = require('express');
const router = Router();

const discordAPI = require('./discord.js');

router.use('/discord', discordAPI);

router.use((err, req, res, next) => {
	res.status(400);
	res.send({ error: err.message || err });
});

module.exports = router;