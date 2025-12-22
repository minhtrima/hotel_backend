const express = require("express");
const router = express.Router();

const {
  createInventory,
  getInventories,
  getInventoryById,
  updateInventory,
  adjustQuantity,
  deleteInventory,
  getAvailableMinibarInventories,
} = require("../controllers/inventory.controller");

// router.use(authMiddleware); // nếu chỉ staff/admin dùng

router.get("/minibar/available", getAvailableMinibarInventories);
router.post("/", createInventory);
router.get("/", getInventories);
router.get("/:id", getInventoryById);
router.put("/:id", updateInventory);
router.patch("/:id/quantity", adjustQuantity);
router.delete("/:id", deleteInventory);

module.exports = router;
