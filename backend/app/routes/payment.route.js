const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// Create payment (cash / bank / vnpay)
router.post("/", paymentController.createPayment);

// Get payment by id
router.get("/:id", paymentController.getPaymentById);

// Get all payments (admin)
router.get("/", paymentController.getAllPayments);

// Get payments by booking
router.get("/booking/:bookingId", paymentController.getPaymentsByBooking);
router.post("/vnpay-payment", paymentController.handleVNPayPayment);
router.get("/vnpay-return", paymentController.handleVNPayReturn);
router.post("/manual-payment", paymentController.handleManualPayment);

// Update payment status (paid / failed / refunded)
router.patch("/:id/status", paymentController.updatePaymentStatus);

// Delete payment (admin only – optional)
router.delete("/:id", paymentController.deletePayment);

module.exports = router;
