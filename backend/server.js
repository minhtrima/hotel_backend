const app = require("./app");
const mongoose = require("mongoose");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const {
  cleanupExpiredPendingBookings,
} = require("./app/controllers/booking.controller");
const { MONGO_URL, PORT } = process.env;

async function startServer() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to the database");

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    // store io instance on express app so controllers can access via req.app.get('io')
    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);
      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });

    // Setup cron job to cleanup expired pending bookings every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
      console.log("[Cron] Running cleanup for expired pending bookings...");
      await cleanupExpiredPendingBookings();
    });

    // Run cleanup on server start
    console.log("[Startup] Running initial cleanup...");
    await cleanupExpiredPendingBookings();

    server.listen(PORT || 3000, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Cannot connect to the database", error);
    process.exit(1);
  }
}

startServer();
