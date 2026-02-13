const express = require("express")
const aiController = require("../Controllers/aiController")
const authController = require("../Controllers/authController");
const router = express.Router();






router.post("/consult",aiController.getAIResponse)



module.exports = router; 