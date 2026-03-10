const express = require("express");
const chatController = require('../Controllers/chatController');
const authController = require('../Controllers/authController');
const router = express.Router();
router.use(authController.protect);




router.route('/')
.post(chatController.sendMessage)
.get(chatController.getChatHistory)



module.exports = router;