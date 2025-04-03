const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

router.get("/:id?", serviceController.getServices);
router.post("/", serviceController.addService);
router.patch("/:id", serviceController.updateService);
router.delete("/:id?", serviceController.deleteService);

module.exports = router;