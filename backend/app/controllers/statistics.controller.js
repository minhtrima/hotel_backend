const Booking = require("../models/booking");
const Room = require("../models/room");
const Type = require("../models/type");
const Service = require("../models/service");
const ApiError = require("../utils/api-error");

// Get total bookings statistics by time period
const getBookingStatsByTime = async (req, res, next) => {
  try {
    const { period = "month", year, month } = req.query;

    console.log("Booking stats request params:", { period, year, month });

    let matchCondition = {};
    let groupBy = {};

    if (period === "day" && year && month) {
      // Daily stats for a specific month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      matchCondition = {
        createdAt: { $gte: startDate, $lte: endDate },
      };

      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
    } else if (period === "month" && year) {
      // Monthly stats for a specific year
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      endDate.setHours(23, 59, 59, 999);

      matchCondition = {
        createdAt: { $gte: startDate, $lte: endDate },
      };

      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
    } else {
      // Default: monthly stats for current year - and also check last year for more data
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear - 1, 0, 1); // Go back one year to get more data
      const endDate = new Date(currentYear, 11, 31);
      endDate.setHours(23, 59, 59, 999);

      matchCondition = {
        createdAt: { $gte: startDate, $lte: endDate },
      };

      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
    }

    console.log("Match condition:", matchCondition);
    console.log("Group by:", groupBy);

    // First, let's check if there are any bookings at all
    const totalBookings = await Booking.countDocuments();
    console.log("Total bookings in database:", totalBookings);

    // Get some sample booking dates to debug
    const sampleBookings = await Booking.find({})
      .limit(5)
      .select("createdAt status totalPrice");
    console.log("Sample bookings:", sampleBookings);

    const bookingStats = await Booking.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy,
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          bookedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "booked"] }, 1, 0] },
          },
          checkedInBookings: {
            $sum: { $cond: [{ $eq: ["$status", "checked_in"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$totalPrice", 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    console.log("Booking stats result:", bookingStats);

    // If no data found, return sample data structure to help with debugging
    if (bookingStats.length === 0) {
      console.log("No booking stats found, returning empty structure");
      const emptyResponse =
        period === "month"
          ? Array.from({ length: 12 }, (_, i) => ({
              _id: {
                year: parseInt(year || new Date().getFullYear()),
                month: i + 1,
              },
              totalBookings: 0,
              completedBookings: 0,
              cancelledBookings: 0,
              pendingBookings: 0,
              bookedBookings: 0,
              checkedInBookings: 0,
              totalRevenue: 0,
            }))
          : [];

      return res.json({
        success: true,
        data: emptyResponse,
        debug: {
          totalBookingsInDB: totalBookings,
          sampleBookings,
          matchCondition,
          groupBy,
        },
      });
    }

    res.json({
      success: true,
      data: bookingStats,
    });
  } catch (error) {
    console.error("Error in getBookingStatsByTime:", error);
    next(new ApiError(500, error.message));
  }
};

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get occupancy rate statistics
const getOccupancyRate = async (req, res, next) => {
  try {
    const { startDate, endDate, roomTypeId } = req.query;

    const start = startDate
      ? normalizeDate(startDate)
      : normalizeDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const end = endDate ? normalizeDate(endDate) : normalizeDate(new Date());

    // Build room filter based on room type if provided
    let roomFilter = {};
    if (roomTypeId) {
      roomFilter = { typeid: roomTypeId };
    }

    const totalRooms = await Room.countDocuments(roomFilter);

    // Build booking filter to include room type filtering
    let bookingMatchFilter = {
      status: { $in: ["booked", "checked_in", "completed"] },
      "rooms.status": { $in: ["booked", "checked_in", "completed"] },
    };

    const bookings = await Booking.find(bookingMatchFilter)
      .populate({
        path: "rooms.roomid",
        match: roomFilter, // This will filter rooms by type
        select: "roomNumber typeid",
      })
      .lean();

    /**
     * Map:
     * {
     *   "2024-12-01": Set(roomId),
     *   "2024-12-02": Set(roomId)
     * }
     */
    const occupancyMap = {};

    for (const booking of bookings) {
      for (const room of booking.rooms) {
        // Skip if room was filtered out by populate match or doesn't have roomid
        if (!room.roomid || room.roomid === null) continue;

        const checkIn = room.actualCheckInDate || room.expectedCheckInDate;
        const checkOut = room.actualCheckOutDate || room.expectedCheckOutDate;

        if (!checkIn || !checkOut) continue;

        let current = normalizeDate(checkIn);
        const checkoutDate = normalizeDate(checkOut);

        while (current < checkoutDate) {
          if (current >= start && current <= end) {
            const key = current.toISOString().split("T")[0];
            if (!occupancyMap[key]) {
              occupancyMap[key] = new Set();
            }
            occupancyMap[key].add(
              room.roomid._id
                ? room.roomid._id.toString()
                : room.roomid.toString()
            );
          }
          current.setDate(current.getDate() + 1);
        }
      }
    }

    const occupancyData = Object.entries(occupancyMap)
      .map(([date, rooms]) => {
        const occupiedRoomsCount = rooms.size;
        return {
          date,
          occupiedRoomsCount,
          totalRooms,
          occupancyRate:
            totalRooms === 0 ? 0 : (occupiedRoomsCount / totalRooms) * 100,
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`Occupancy data for roomTypeId ${roomTypeId}:`, {
      totalRooms,
      dataPoints: occupancyData.length,
      sampleData: occupancyData.slice(0, 3),
    });

    res.json({
      success: true,
      data: {
        totalRooms,
        occupancyData,
      },
    });
  } catch (error) {
    console.error("Error in getOccupancyRate:", error);
    next(error);
  }
};

// Get monthly revenue statistics
const getMonthlyRevenue = async (req, res, next) => {
  try {
    const {
      year = new Date().getFullYear(),
      revenueType = "actual",
      projectedDays = 30,
    } = req.query;

    let matchCondition, groupBy, completeData;

    if (revenueType === "projected") {
      // For projected revenue: get checked_in bookings and group by day
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(projectedDays));
      endDate.setHours(23, 59, 59, 999);

      matchCondition = {
        status: "checked_in",
        "rooms.expectedCheckOutDate": { $gte: startDate, $lte: endDate },
      };

      groupBy = {
        year: { $year: "$rooms.expectedCheckOutDate" },
        month: { $month: "$rooms.expectedCheckOutDate" },
        day: { $dayOfMonth: "$rooms.expectedCheckOutDate" },
      };

      const projectedRevenue = await Booking.aggregate([
        { $match: matchCondition },
        { $unwind: "$rooms" },
        {
          $match: {
            "rooms.expectedCheckOutDate": { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: groupBy,
            totalRevenue: { $sum: "$totalPrice" },
            totalBookings: { $sum: 1 },
            averageBookingValue: { $avg: "$totalPrice" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);

      // Fill in missing days with zero revenue
      completeData = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayData = projectedRevenue.find(
          (item) =>
            item._id.year === currentDate.getFullYear() &&
            item._id.month === currentDate.getMonth() + 1 &&
            item._id.day === currentDate.getDate()
        );

        completeData.push({
          date: currentDate.toISOString().split("T")[0],
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          day: currentDate.getDate(),
          totalRevenue: dayData ? dayData.totalRevenue : 0,
          totalBookings: dayData ? dayData.totalBookings : 0,
          averageBookingValue: dayData ? dayData.averageBookingValue : 0,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // For actual revenue: get completed bookings and group by month
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      matchCondition = {
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      };

      const monthlyRevenue = await Booking.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalRevenue: { $sum: "$totalPrice" },
            totalBookings: { $sum: 1 },
            averageBookingValue: { $avg: "$totalPrice" },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);

      // Fill in missing months with zero revenue
      completeData = [];
      for (let month = 1; month <= 12; month++) {
        const monthData = monthlyRevenue.find(
          (item) => item._id.month === month
        );
        completeData.push({
          month: month,
          year: parseInt(year),
          totalRevenue: monthData ? monthData.totalRevenue : 0,
          totalBookings: monthData ? monthData.totalBookings : 0,
          averageBookingValue: monthData ? monthData.averageBookingValue : 0,
        });
      }
    }

    res.json({
      success: true,
      data: completeData,
      revenueType,
    });
  } catch (error) {
    console.error("Error in getMonthlyRevenue:", error);
    next(new ApiError(500, error.message));
  }
};

// Get revenue by room type
const getRevenueByRoomType = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    end.setHours(23, 59, 59, 999);

    console.log("Revenue by room type query:", { start, end });

    // Get revenue by room type using a simpler approach
    const revenueByType = await Booking.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: start, $lte: end },
          totalPrice: { $gt: 0 },
        },
      },
      { $unwind: "$rooms" },
      {
        $lookup: {
          from: "types",
          localField: "rooms.desiredRoomTypeId",
          foreignField: "_id",
          as: "roomType",
        },
      },
      { $unwind: "$roomType" },
      {
        $group: {
          _id: {
            typeId: "$roomType._id",
            typeName: "$roomType.name",
          },
          totalRevenue: { $sum: "$totalPrice" },
          totalBookings: { $sum: 1 },
          averagePrice: { $avg: { $ifNull: ["$rooms.pricePerNight", 0] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    console.log(
      "Revenue by type result:",
      JSON.stringify(revenueByType, null, 2)
    );

    res.json({
      success: true,
      data: revenueByType,
    });
  } catch (error) {
    console.error("Error in getRevenueByRoomType:", error);
    next(new ApiError(500, error.message));
  }
};

// Get top services statistics
const getTopServices = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const topServices = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["completed", "checked_in"] },
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $unwind: "$services" },
      {
        $lookup: {
          from: "services",
          localField: "services.serviceId",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      { $unwind: "$serviceDetails" },
      {
        $group: {
          _id: {
            serviceId: "$services.serviceId",
            serviceName: "$serviceDetails.name",
            category: "$serviceDetails.category",
          },
          totalQuantity: { $sum: "$services.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$services.quantity", "$services.price"] },
          },
          timesOrdered: { $sum: 1 },
          averagePrice: { $avg: "$services.price" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Also get services from room additional services
    const roomServices = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["completed", "checked_in"] },
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $unwind: "$rooms" },
      { $unwind: "$rooms.additionalServices" },
      {
        $lookup: {
          from: "services",
          localField: "rooms.additionalServices.serviceId",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      { $unwind: "$serviceDetails" },
      {
        $group: {
          _id: {
            serviceId: "$rooms.additionalServices.serviceId",
            serviceName: "$serviceDetails.name",
            category: "$serviceDetails.category",
          },
          totalQuantity: { $sum: "$rooms.additionalServices.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: [
                "$rooms.additionalServices.quantity",
                "$rooms.additionalServices.price",
              ],
            },
          },
          timesOrdered: { $sum: 1 },
          averagePrice: { $avg: "$rooms.additionalServices.price" },
        },
      },
    ]);

    // Combine both service sources
    const combinedServices = {};

    [...topServices, ...roomServices].forEach((service) => {
      const key = service._id.serviceId.toString();
      if (combinedServices[key]) {
        combinedServices[key].totalQuantity += service.totalQuantity;
        combinedServices[key].totalRevenue += service.totalRevenue;
        combinedServices[key].timesOrdered += service.timesOrdered;
      } else {
        combinedServices[key] = service;
      }
    });

    const finalTopServices = Object.values(combinedServices)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: finalTopServices,
    });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

// Get overall dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Total counts
    const totalRooms = await Room.countDocuments();
    const totalBookingsThisMonth = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const totalRevenueThisMonth = await Booking.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    // Current occupancy
    const currentOccupancy = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["booked", "checked_in"] },
          "rooms.expectedCheckInDate": { $lte: today },
          "rooms.expectedCheckOutDate": { $gte: today },
        },
      },
      { $unwind: "$rooms" },
      {
        $match: {
          "rooms.expectedCheckInDate": { $lte: today },
          "rooms.expectedCheckOutDate": { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          occupiedRooms: { $addToSet: "$rooms.roomid" },
        },
      },
      {
        $project: {
          occupiedCount: { $size: "$occupiedRooms" },
          occupancyRate: {
            $multiply: [
              { $divide: [{ $size: "$occupiedRooms" }, totalRooms] },
              100,
            ],
          },
        },
      },
    ]);

    // Recent bookings trend
    const bookingTrend = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const dashboardData = {
      totalRooms,
      totalBookingsThisMonth,
      totalRevenueThisMonth: totalRevenueThisMonth[0]?.total || 0,
      currentOccupancy: currentOccupancy[0] || {
        occupiedCount: 0,
        occupancyRate: 0,
      },
      bookingTrend,
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

// Get all room types for filtering
const getRoomTypes = async (req, res, next) => {
  try {
    const roomTypes = await Type.find().select("name _id");

    res.json({
      success: true,
      data: roomTypes,
    });
  } catch (error) {
    console.error("Error in getRoomTypes:", error);
    next(error);
  }
};

module.exports = {
  getBookingStatsByTime,
  getOccupancyRate,
  getMonthlyRevenue,
  getRevenueByRoomType,
  getTopServices,
  getDashboardStats,
  getRoomTypes,
};
