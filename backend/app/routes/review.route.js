const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");

// Public routes
router.get("/public", reviewController.getVisibleReviews);
router.get("/stats", reviewController.getReviewStats);

// Protected routes (require authentication)
router.post("/", reviewController.createReview);
router.get("/", reviewController.getAllReviews);
router.get("/:reviewId", reviewController.getReviewById);
router.get("/booking/:bookingId", reviewController.getReviewByBookingId);
router.put("/:reviewId/toggle", reviewController.toggleReviewVisibility);
router.put("/:reviewId/visibility", reviewController.updateReviewVisibility);
router.delete("/:reviewId", reviewController.deleteReview);

module.exports = router;
