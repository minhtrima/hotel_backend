const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
      required: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    codeMonth: {
      type: String,
      required: true, // Store "MMYY"
    },

    customerid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerSnapshot: {
      honorific: String,
      firstName: String,
      lastName: String,
      email: String,
      phoneNumber: String,
      identificationNumber: String,
      dateOfBirth: Date,
    },
    status: {
      type: String,
      enum: ["pending", "booked", "checked_in", "completed", "cancelled"],
      default: "pending",
    },
    specialRequests: String,
    internalNotes: String,
    expectedCheckInDate: Date,
    expectedCheckOutDate: Date,
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "partially_paid", "refunded"],
      default: "unpaid",
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    moneyReceived: {
      type: Number,
      default: 0,
    },
    change: {
      type: Number,
      default: 0,
    },
    staffCheckIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    staffCheckOut: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
        quantity: Number,
        price: Number,
      },
    ],
    rooms: [
      {
        roomid: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Room",
        },
        roomSnapshot: {
          roomNumber: String,
          typeName: String,
        },
        desiredRoomTypeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Type",
        },
        status: {
          type: String,
          enum: ["booked", "pending", "checked_in", "completed"],
          default: "booked",
        },
        numberOfAdults: Number,
        numberOfChildren: Number,
        pricePerNight: Number,
        extraBedAdded: { type: Boolean, default: false },
        expectedCheckInDate: Date,
        expectedCheckOutDate: Date,
        actualCheckInDate: Date,
        actualCheckOutDate: Date,
        bookingPrice: Number,
        mainGuest: {
          honorific: String,
          firstName: String,
          lastName: String,
          phoneNumber: String,
          gender: String,
          dateOfBirth: Date,
          identificationNumber: String,
          nationality: String,
        },
        additionalGuests: [
          {
            firstName: String,
            lastName: String,
            gender: String,
            dateOfBirth: Date,
            identificationNumber: String,
            nationality: String,
            isChild: Boolean,
          },
        ],
        additionalServices: [
          {
            serviceId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Service",
            },
            quantity: Number,
            price: Number,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
