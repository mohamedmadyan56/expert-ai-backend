const express = require("express")
const authController = require('../Controllers/authController');
const userController = require('../Controllers/userController');

const router = express.Router();



router.post("/signup",authController.signup);
router.post("/login",authController.login);
router.patch(
  '/updateMe', 
  authController.protect, // الحماية رجعت!
  userController.uploadUserPhoto, 
  userController.resizeUserPhoto, 
  userController.updateMe
);router.get('/getMe', authController.protect, userController.getMe);
router.delete('/deleteMe',authController.protect, userController.deleteMe)

module.exports = router;
