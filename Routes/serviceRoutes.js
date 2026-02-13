const express = require("express")
const router = express.Router();

const serviceController = require("../Controllers/serviceController")
const authController= require("../Controllers/authController");




router.get("/all",serviceController.getAllServices)

router.use(authController.protect);
//ده معناه اي حاجه جايه بعد ال,middleware ده هيتطبق عليه ال protect





router.post("/add",authController.restrictTo("expert","admin"),serviceController.addService)

router.delete("/:id",authController.restrictTo("admin"),serviceController.deleteService)
router.put("/:id",authController.restrictTo("admin"),serviceController.updateService)



module.exports = router;