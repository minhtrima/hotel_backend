const express = require("express");
const router = express.Router();
const cccdScanController = require("../controllers/cccdScan.controller");

// Create scan session
router.post("/create-session", cccdScanController.createScanSession);

// Submit CCCD data from mobile
router.post("/submit-data", cccdScanController.submitCCCDData);

// Check session status
router.get("/session/:sessionId", cccdScanController.checkSessionStatus);

module.exports = router;
