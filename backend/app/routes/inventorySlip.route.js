const express = require("express");
const router = express.Router();
const inventorySlipController = require("../controllers/inventorySlip.controller");

// tạo phiếu vật tư
router.post("/", inventorySlipController.createSlip);

// hủy phiếu (rollback kho)
router.delete("/:id", inventorySlipController.cancelSlip);

// danh sách phiếu theo phòng / task
router.get("/", inventorySlipController.getSlips);

module.exports = router;
