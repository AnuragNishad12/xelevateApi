const express = require("express");
const router = express.Router();
const aircraftController = require("../controllers/aircraftController");

router.get("/:id?", aircraftController.getAircrafts);
router.post("/", aircraftController.addAircraft);
router.patch("/:id", aircraftController.updateAircraft);
router.delete("/:id?", aircraftController.deleteAircraft);

module.exports = router;