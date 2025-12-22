const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    // Snapshot of customer info at time of review
    customerSnapshot: {
      honorific: String,
      firstName: String,
      lastName: String,
    },
    // Snapshot of booking info
    bookingSnapshot: {
      bookingCode: String,
      checkInDate: Date,
      checkOutDate: Date,
      roomTypes: [String], // Array of room type names
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
reviewSchema.index({ bookingId: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ isVisible: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
