const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  checkInBooking,
  checkOut,
  cancelBooking,
  paymentBooking,
  getBookingByRoomId,
  getPaymentBooking,
  saveBookingServices,
  saveTransportationServices,
  createTemporaryBooking,
  updateTemporaryBooking,
  addRoomToTemporaryBooking,
  removeRoomFromTemporaryBooking,
  addServiceForTemporaryBooking,
  addServiceToTemporaryBooking,
  addTransportationServiceToBooking,
  ConfirmTemporaryBooking,
  resetRoomInTemporaryBooking,
  resetDateInTemporaryBooking,
  lookupBooking,
  requestCancellation,
  changeRoom,
  sendReceiptEmail,
  getReceiptData,
} = require("../controllers/booking.controller");

const router = require("express").Router();

router.get("/", getAllBookings);
router.get("/lookup", lookupBooking);
router.get("/room/:roomId", getBookingByRoomId);
router.get("/payment/:bookingId", getPaymentBooking);
router.get("/:bookingId/receipt", getReceiptData);
router.get("/:bookingId", getBookingById);

router.post("/", createBooking);
router.post("/temporary", createTemporaryBooking);
router.post("/:bookingId/send-receipt", sendReceiptEmail);
router.post("/cancel-request/:bookingId", requestCancellation);

router.put("/update/temp/:bookingId", updateTemporaryBooking);
router.put("/add-room/:bookingId", addRoomToTemporaryBooking);
router.put("/remove-room/:bookingId", removeRoomFromTemporaryBooking);
router.put("/service-room/:bookingId", addServiceForTemporaryBooking);
router.put("/add-service/:bookingId", addServiceToTemporaryBooking);
router.put("/confirm-booking/:bookingId", ConfirmTemporaryBooking);
router.put("/reset-room/:bookingId", resetRoomInTemporaryBooking);
router.put("/reset-date/:bookingId", resetDateInTemporaryBooking);
router.put("/service/:bookingId", saveBookingServices);
router.put("/transportation/:bookingId", saveTransportationServices);
router.put("/update/:bookingId", updateBooking);
router.put("/checkin/:bookingId", checkInBooking);
router.put("/checkout/:bookingId", checkOut);
router.put("/cancel/:bookingId", cancelBooking);
router.put("/payment/:bookingId", paymentBooking);
router.put("/change-room/:bookingId", changeRoom);

router.delete("/:bookingId", deleteBooking);

module.exports = router;
