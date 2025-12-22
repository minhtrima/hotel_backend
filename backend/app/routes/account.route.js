const {
  checkAccountStatus,
  checkStaffAccount,
  createStaffAccount,
  restoreStaffAccount,
  activateAccount,
  setPasswordAndActivate,
} = require("../controllers/account.controller");

const router = require("express").Router();

// Check account status for staff (new endpoint)
router.get("/status/:staffId", checkAccountStatus);

// Check if staff has account (legacy)
router.get("/check/:staffId", checkStaffAccount);

// Create account for staff
router.post("/create/:staffId", createStaffAccount);

// Restore account for staff
router.post("/restore/:staffId", restoreStaffAccount);

// Activate account with token
router.get("/activate/:token", activateAccount);

// Set password and activate account
router.post("/activate/:token", setPasswordAndActivate);

module.exports = router;
