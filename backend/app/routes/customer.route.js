const {
  createCustomerData,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customer.controller");

const router = require("express").Router();

router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);

router.post("/", createCustomerData);

router.put("/:id", updateCustomer);

router.delete("/:id", deleteCustomer);

module.exports = router;
