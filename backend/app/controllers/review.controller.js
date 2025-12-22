const Review = require("../models/review");
const Booking = require("../models/booking");
const Customer = require("../models/customer");
const ApiError = require("../utils/api-error");

// Create a new review
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, customerId, rating, comment } = req.body;

    // Validate required fields
    if (!bookingId || !customerId || !rating || !comment) {
      return next(new ApiError(400, "Vui lòng cung cấp đầy đủ thông tin"));
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return next(new ApiError(400, "Đánh giá phải từ 1 đến 5 sao"));
    }

    // Check if booking exists and belongs to customer
    const booking = await Booking.findById(bookingId)
      .populate("customerid")
      .populate("rooms.desiredRoomTypeId");

    if (!booking) {
      return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    }

    if (booking.customerid?._id?.toString() !== customerId) {
      return next(
        new ApiError(403, "Bạn không có quyền đánh giá đặt phòng này")
      );
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return next(
        new ApiError(400, "Chỉ có thể đánh giá sau khi hoàn tất đặt phòng")
      );
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return next(new ApiError(400, "Đặt phòng này đã được đánh giá"));
    }

    // Get customer info
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return next(new ApiError(404, "Không tìm thấy khách hàng"));
    }

    // Get room types from booking
    const roomTypes = booking.rooms
      .map((room) => room.desiredRoomTypeId?.name)
      .filter(Boolean);

    // Get check-in/out dates
    const checkInDate =
      booking.rooms[0]?.actualCheckInDate ||
      booking.rooms[0]?.expectedCheckInDate;
    const checkOutDate =
      booking.rooms[0]?.actualCheckOutDate ||
      booking.rooms[0]?.expectedCheckOutDate;

    // Create review with snapshots
    const review = new Review({
      bookingId,
      customerId,
      rating,
      comment,
      customerSnapshot: {
        honorific: customer.honorific,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
      bookingSnapshot: {
        bookingCode: booking.bookingCode,
        checkInDate,
        checkOutDate,
        roomTypes,
      },
    });

    await review.save();

    res.status(201).json({
      success: true,
      review,
      message: "Cảm ơn bạn đã đánh giá!",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    next(new ApiError(500, "Lỗi khi tạo đánh giá"));
  }
};

// Get all reviews (with filters)
exports.getAllReviews = async (req, res, next) => {
  try {
    const { isVisible, rating, limit = 100, page = 1 } = req.query;

    const filter = {};
    if (isVisible !== undefined) {
      filter.isVisible = isVisible === "true";
    }
    if (rating) {
      filter.rating = parseInt(rating);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate("bookingId", "bookingCode status")
      .populate("customerId", "firstName lastName email phoneNumber")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    next(new ApiError(500, "Lỗi khi lấy danh sách đánh giá"));
  }
};

// Get visible reviews (public endpoint)
exports.getVisibleReviews = async (req, res, next) => {
  try {
    const { limit = 10, page = 1, rating } = req.query;

    const filter = { isVisible: true };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .select("-customerId -bookingId")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Review.countDocuments(filter);

    // Calculate average rating
    const avgResult = await Review.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const stats = avgResult[0] || { avgRating: 0, totalReviews: 0 };

    res.status(200).json({
      success: true,
      reviews,
      stats: {
        averageRating: stats.avgRating.toFixed(1),
        totalReviews: stats.totalReviews,
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching visible reviews:", error);
    next(new ApiError(500, "Lỗi khi lấy danh sách đánh giá"));
  }
};

// Get review by ID
exports.getReviewById = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate("bookingId")
      .populate("customerId");

    if (!review) {
      return next(new ApiError(404, "Không tìm thấy đánh giá"));
    }

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    next(new ApiError(500, "Lỗi khi lấy thông tin đánh giá"));
  }
};

// Get reviews by booking ID
exports.getReviewByBookingId = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const review = await Review.findOne({ bookingId })
      .populate("bookingId")
      .populate("customerId");

    if (!review) {
      return res.status(200).json({
        success: true,
        review: null,
        message: "Chưa có đánh giá cho đặt phòng này",
      });
    }

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error fetching review by booking:", error);
    next(new ApiError(500, "Lỗi khi lấy đánh giá"));
  }
};

// Toggle review visibility
exports.toggleReviewVisibility = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return next(new ApiError(404, "Không tìm thấy đánh giá"));
    }

    review.isVisible = !review.isVisible;
    await review.save();

    res.status(200).json({
      success: true,
      review,
      message: `Đánh giá đã được ${review.isVisible ? "hiển thị" : "ẩn"}`,
    });
  } catch (error) {
    console.error("Error toggling review visibility:", error);
    next(new ApiError(500, "Lỗi khi cập nhật trạng thái đánh giá"));
  }
};

// Update review visibility
exports.updateReviewVisibility = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { isVisible } = req.body;

    if (isVisible === undefined) {
      return next(new ApiError(400, "Vui lòng cung cấp trạng thái hiển thị"));
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isVisible },
      { new: true }
    );

    if (!review) {
      return next(new ApiError(404, "Không tìm thấy đánh giá"));
    }

    res.status(200).json({
      success: true,
      review,
      message: `Đánh giá đã được ${isVisible ? "hiển thị" : "ẩn"}`,
    });
  } catch (error) {
    console.error("Error updating review visibility:", error);
    next(new ApiError(500, "Lỗi khi cập nhật trạng thái đánh giá"));
  }
};

// Delete review
exports.deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return next(new ApiError(404, "Không tìm thấy đánh giá"));
    }

    res.status(200).json({
      success: true,
      message: "Xóa đánh giá thành công",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    next(new ApiError(500, "Lỗi khi xóa đánh giá"));
  }
};

// Get review statistics
exports.getReviewStats = async (req, res, next) => {
  try {
    const stats = await Review.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        },
      },
    ]);

    const result = stats[0] || {
      totalReviews: 0,
      avgRating: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0,
    };

    res.status(200).json({
      success: true,
      stats: {
        totalReviews: result.totalReviews,
        averageRating: result.avgRating ? result.avgRating.toFixed(1) : "0",
        ratingDistribution: {
          5: result.rating5,
          4: result.rating4,
          3: result.rating3,
          2: result.rating2,
          1: result.rating1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    next(new ApiError(500, "Lỗi khi lấy thống kê đánh giá"));
  }
};
