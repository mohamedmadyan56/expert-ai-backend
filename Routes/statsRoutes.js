const express = require("express");
const chatController = require('../Controllers/chatController');
const authController = require('../Controllers/authController');

const statsController = require('../Controllers/statsController');
const router = express.Router();


router.get('/',statsController.getPlatformStats)
router.get('/about-info',statsController.getAboutStats)

module.exports = router;