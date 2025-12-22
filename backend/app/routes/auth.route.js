const {
  findAll,
  create,
  login,
  logout,
  changePassword,
} = require("../controllers/auth.controller");

const router = require("express").Router();

router.get("/findAll", findAll);

router.post("/create", create);
router.post("/login", login);
router.post("/logout", logout);
router.post("/change-password", changePassword);

module.exports = router;
