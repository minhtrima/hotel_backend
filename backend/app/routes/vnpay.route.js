const express = require("express");
const vnpayController = require("../controllers/vnpay.controller");

const router = express.Router();

// Create VNPay payment URL
router.post("/create-payment-url/:bookingId", vnpayController.createPaymentUrl);

// Handle VNPay return (for API)
router.get("/vnpay-return", vnpayController.vnpayReturn);

module.exports = router;
