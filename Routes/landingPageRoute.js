const express = require('express');
const { landingPage } = require('../Controllers/landingPageController');

const router = express.Router();

router.route('/').get(landingPage);

module.exports = router;
