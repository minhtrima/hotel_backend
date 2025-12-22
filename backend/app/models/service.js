const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "per_unit",
        "per_person",
        "per_duration",
        "fixed",
        "transportation",
        "minibar",
      ],
    },
    unit: {
      type: String,
      enum: ["unit", "person", "hour", "day", "fixed"],
    },
    unitDisplay: {
      type: String,
    },
    forEachRoom: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    images: [
      {
        url: String,
        isPrimary: Boolean,
        alt: String,
        caption: String,
      },
    ],
    inventoryItemId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
      },
    ],
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
