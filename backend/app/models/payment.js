const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // customer or staff who created the payment
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "VND",
    },

    method: {
      type: String,
      enum: [
        "cash", // pay at hotel
        "bank_transfer", // manual transfer
        "vnpay",
      ],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "online", // vnpay
        "offline", // cash + bank transfer
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending", // waiting for payment
        "paid", // successful
        "failed", // failed / canceled
        "refunded",
      ],
      default: "pending",
    },

    isDeposit: {
      type: Boolean,
      default: false,
    },

    transactionCode: {
      type: String,
      default: null, // VNPay transaction id / bank ref
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    note: {
      type: String,
      default: "",
    },

    metadata: {
      type: Object,
      default: {}, // VNPay response / bank payload
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
