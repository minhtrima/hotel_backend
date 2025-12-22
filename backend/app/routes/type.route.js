const {
  getAllTypes,
  getTypeById,
  createType,
  updateType,
  deleteType,
  uploadTypeImages,
  getTypeByName,
} = require("../controllers/type.controller");

const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getAllTypes);
router.get("/:id", getTypeById);
router.get("/name/:name", getTypeByName);

router.post("/", createType);

router.put("/:id", updateType);
router.put("/:id/images", upload.array("images"), uploadTypeImages);

router.delete("/:id", deleteType);

module.exports = router;
