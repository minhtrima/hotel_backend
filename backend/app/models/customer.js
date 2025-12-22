const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  honorific: {
    type: String,
    enum: ["Ông", "Bà"],
    default: "Ông",
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    default: "other",
  },
  email: String,
  phoneNumber: String,
  identification: {
    type: String,
    enum: ["passport", "national_id", "driver_license"],
  },
  identificationNumber: String,
  nationality: String,
  dateOfBirth: {
    type: Date,
    default: Date,
  },
  bookingHistory: [Object],
});

module.exports = mongoose.model("Customer", customerSchema);
