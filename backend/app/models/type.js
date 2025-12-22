const mongoose = require("mongoose");

const typeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    maxGuest: {
      type: Number,
      required: true,
    },
    extraBedAllowed: {
      type: Boolean,
      default: false,
    },
    extraBedPrice: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    amenities: {
      type: [String],
      enum: [
        "wifi",
        "air_conditioning",
        "tv",
        "minibar",
        "balcony",
        "sea_view",
        "room_service",
        "safe_box",
        "coffee_maker",
        "hair_dryer",
        "bath_tub",
        "shower",
        "desk",
        "wardrobe",
        "telephone",
        "heating",
        "kitchenette",
      ],
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    images: [
      {
        url: String,
        isPrimary: Boolean,
        alt: String,
        caption: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Type", typeSchema);
