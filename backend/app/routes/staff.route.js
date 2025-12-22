const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  changeAvatar,
  getHousekeepingStaff,
} = require("../controllers/staff.controller");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = require("express").Router();

router.get("/findAll", getAllStaff);
router.get("/housekeeping", getHousekeepingStaff);
router.get("/", getAllStaff);
router.get("/:id", getStaffById);

router.post("/", upload.fields([{ name: "avatar", maxCount: 1 }]), createStaff);

router.put(
  "/:id",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateStaff
);

// Route đơn giản cho việc đổi avatar - không dùng multer, nhận base64
router.put("/:id/avatar", changeAvatar);

router.delete("/:id", deleteStaff);

module.exports = router;
