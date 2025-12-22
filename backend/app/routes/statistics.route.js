const express = require("express");
const {
  getBookingStatsByTime,
  getOccupancyRate,
  getMonthlyRevenue,
  getRevenueByRoomType,
  getTopServices,
  getDashboardStats,
  getRoomTypes,
} = require("../controllers/statistics.controller");

const router = express.Router();

// GET /api/statistics/bookings - Get booking statistics by time period
router.get("/bookings", getBookingStatsByTime);

// GET /api/statistics/occupancy - Get occupancy rate statistics
router.get("/occupancy", getOccupancyRate);

// GET /api/statistics/revenue/monthly - Get monthly revenue statistics
router.get("/revenue/monthly", getMonthlyRevenue);

// GET /api/statistics/revenue/room-type - Get revenue by room type
router.get("/revenue/room-type", getRevenueByRoomType);

// GET /api/statistics/services/top - Get top services statistics
router.get("/services/top", getTopServices);

// GET /api/statistics/dashboard - Get overall dashboard statistics
router.get("/dashboard", getDashboardStats);

// GET /api/statistics/room-types - Get all room types for filtering
router.get("/room-types", getRoomTypes);

module.exports = router;
