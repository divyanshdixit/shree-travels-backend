const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contact');


router.post('/postquery', ContactController.PostQuery);

module.exports = router;

