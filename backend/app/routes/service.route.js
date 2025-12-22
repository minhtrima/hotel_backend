const {
  getAllServices,
  createService,
  updateService,
  deleteService,
  getServiceById,
  uploadServiceImages,
  getTransportationService,
  getNonRoomService,
} = require("../controllers/service.controller");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = require("express").Router();

router.get("/", getAllServices);
router.get("/transportation", getTransportationService);
router.get("/non-room", getNonRoomService);
router.get("/:id", getServiceById);

router.post("/", createService);

router.put("/:id", updateService);
router.put("/:id/images", upload.array("images"), uploadServiceImages);

router.delete("/:id", deleteService);

module.exports = router;
