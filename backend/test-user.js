require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./app/models/user");
const bcrypt = require("bcrypt");

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to the database");

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("Test user already exists:");
      console.log({
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      });
      console.log("Password: 123456");
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash("123456", 10);
    const testUser = new User({
      email: "test@example.com",
      name: "Test User",
      password: hashedPassword,
      role: "admin",
    });

    await testUser.save();
    console.log("Test user created successfully!");
    console.log({
      email: "test@example.com",
      password: "123456",
      name: "Test User",
      role: "admin",
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();
