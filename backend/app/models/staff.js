const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    enum: ["receptionist", "manager", "housekeeping", "admin"],
    default: "receptionist",
  },
  shift: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },

  avatar: {
    type: String,
    default:
      "https://th.bing.com/th/id/OIP.Z5BlhFYs_ga1fZnBWkcKjQHaHz?w=188&h=198&c=7&r=0&o=5&pid=1.7.jpg",
  },
  identificationNumber: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
  salary: {
    type: Number,
  },
});

module.exports = mongoose.model("Staff", staffSchema);
