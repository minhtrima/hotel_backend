const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      unique: true,
    },
    floor: {
      type: String,
      required: true,
    },
    typeid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Type",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    housekeepingStatus: {
      type: String,
      enum: ["cleaning", "clean", "dirty"],
      default: "clean",
    },
    doNotDisturb: { type: Boolean, default: false }, // DND
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
