const express = require("express");
const router = express.Router();
const {
  getAssignedRooms,
  updateHousekeepingStatus,
  startCleaning,
  completeCleaning,
} = require("../controllers/housekeeping.controller");

// Lấy danh sách phòng được phân công
router.get("/rooms/:staffId", getAssignedRooms);

// Cập nhật trạng thái housekeeping
router.patch("/rooms/:roomId/status", updateHousekeepingStatus);

// Bắt đầu dọn phòng
router.post("/rooms/:roomId/start", startCleaning);

// Hoàn thành dọn phòng
router.post("/rooms/:roomId/complete", completeCleaning);

module.exports = router;
