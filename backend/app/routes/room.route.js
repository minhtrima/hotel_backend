const {
  getAllRooms,
  createRoom,
  getRoomById,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
  getRoomForCheckIn,
  getAvailableRoom,
} = require("../controllers/room.controller.js");

const router = require("express").Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getAllRooms);
router.get("/findAll", getAllRooms);
router.get("/detail/:id", getRoomById);
router.get("/available", getAvailableRoom);
router.get("/checkIn/:typeId", getRoomForCheckIn);

router.post(
  "/",
  upload.fields([{ name: "primaryImage", maxCount: 1 }, { name: "images" }]),
  createRoom
);

router.put("/:id", updateRoom);
router.put("/:id/status", updateRoomStatus);

router.delete("/:id", deleteRoom);

module.exports = router;
