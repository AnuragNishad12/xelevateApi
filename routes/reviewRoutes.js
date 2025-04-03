const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

router.get("/:id?", reviewController.getReviews);
router.post("/", reviewController.addReview);
router.patch("/:id", reviewController.updateReview);
router.delete("/:id?", reviewController.deleteReview);

module.exports = router;