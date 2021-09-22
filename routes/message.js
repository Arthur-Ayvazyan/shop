const express = require('express');

const messageController = require('../controllers/message');

const router = express.Router();

router.get('/feedback', messageController.getMail);

router.post('/feedback', messageController.postMail);

module.exports = router;