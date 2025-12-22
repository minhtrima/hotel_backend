require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.createSecretToken = (id, role = "staff") => {
  // Admin: 24 hours, Staff: 30 minutes
  const expiresIn = role === "admin" ? 24 * 60 * 60 : 30 * 60;

  return jwt.sign({ id }, process.env.TOKEN_KEY, {
    expiresIn: expiresIn,
  });
};
