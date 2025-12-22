const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["LINEN", "TOILETRY", "CLEANING", "OTHER", "MINIBAR"],
      required: true,
    },

    type: {
      type: String,
      enum: ["CONSUMABLE", "REUSABLE"], // tiêu hao | luân chuyển
      required: true,
    },

    unit: {
      type: String,
      default: "cái", // chai, bộ, kg...
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    minQuantity: {
      type: Number,
      default: 0, // cảnh báo thiếu
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
