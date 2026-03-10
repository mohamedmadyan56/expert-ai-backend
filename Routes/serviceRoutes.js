const express = require("express");
const router = express.Router();

const serviceController = require("../Controllers/serviceController");
const authController = require("../Controllers/authController");

// 🔒 كل الـ routes محمية
router.use(authController.protect);

router.get("/all", serviceController.getAllServices);
router.post("/create", serviceController.addService);
router.delete("/delete/:id", serviceController.deleteService);  // ✅ صلحنا
router.patch("/update/:id", serviceController.updateService);   // ✅ صلحنا

module.exports = router;
