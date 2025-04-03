const express = require("express");
const router = express.Router();
const dealController = require("../controllers/dealController");

router.get("/:id?", dealController.getDeals);
router.post("/", dealController.addDeal);
router.patch("/:id", dealController.updateDeal);
router.delete("/:id?", dealController.deleteDeal);

module.exports = router;