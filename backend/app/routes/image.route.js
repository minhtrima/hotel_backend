const {
  getAllImages,
  getImagesByCategory,
  getImage,
  uploadImage,
  updateImage,
  deleteImage,
  updatePositions,
  getCategories,
} = require("../controllers/image.controller");

const router = require("express").Router();

// Public routes - không cần authentication
router.get("/category/:category", getImagesByCategory);
router.get("/categories", getCategories);

// Admin routes - cần authentication và authorization
router.get("/", getAllImages);
router.get("/:id", getImage);
router.post("/upload", uploadImage);
router.put("/:id", updateImage);
router.delete("/:id", deleteImage);
router.put("/positions/bulk", updatePositions);

module.exports = router;
