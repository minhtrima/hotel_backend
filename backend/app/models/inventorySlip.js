const mongoose = require("mongoose");

const inventorySlipSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    type: {
      type: String,
      enum: ["REFILL", "CHECKOUT", "INSPECTION", "LOSS", "DAMAGE", "MINIBAR"],
      default: "REFILL",
    },

    items: [
      {
        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        inventoryType: {
          type: String,
          enum: ["CONSUMABLE", "REUSABLE"],
          required: true,
        },

        condition: {
          type: String,
          enum: ["GOOD", "DIRTY", "DAMAGED", "LOST", "USED"],
          default: "GOOD",
        },
      },
    ],
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventorySlip", inventorySlipSchema);
