const Image = require("../models/image");
const ApiError = require("../utils/api-error");
const { uploadSingleImage } = require("../utils/cloudinaryUpload");
const multer = require("multer");

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Chỉ chấp nhận file hình ảnh"), false);
    }
  },
});

// Get all images with filtering
exports.getAllImages = async (req, res, next) => {
  try {
    console.log("getAllImages called with query:", req.query);

    const { category, isActive, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      // Use regex instead of text search to avoid index requirement
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Filter:", filter);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { category: 1, position: 1, createdAt: -1 },
      populate: {
        path: "uploadedBy",
        select: "name email",
      },
    };

    const images = await Image.find(filter)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Image.countDocuments(filter);

    console.log("Found images:", images.length, "Total:", total);

    res.status(200).json({
      success: true,
      data: images,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Get all images error:", error);
    return next(new ApiError(500, "Lỗi khi lấy danh sách hình ảnh"));
  }
};

// Get images by category for public use
exports.getImagesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const images = await Image.find({
      category,
      isActive: true,
    }).sort({ position: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Get images by category error:", error);
    return next(new ApiError(500, "Lỗi khi lấy hình ảnh"));
  }
};

// Get single image
exports.getImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id).populate("uploadedBy", "name email");

    if (!image) {
      return next(new ApiError(404, "Không tìm thấy hình ảnh"));
    }

    res.status(200).json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error("Get image error:", error);
    return next(new ApiError(500, "Lỗi khi lấy thông tin hình ảnh"));
  }
};

// Upload new image
exports.uploadImage = async (req, res, next) => {
  try {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        return next(new ApiError(400, err.message));
      }

      if (!req.file) {
        return next(new ApiError(400, "Vui lòng chọn file hình ảnh"));
      }

      const { title, description, category, alt, position = 0 } = req.body;

      if (!title || !category) {
        return next(new ApiError(400, "Tiêu đề và danh mục là bắt buộc"));
      }

      try {
        // Upload to Cloudinary using the utility function
        const result = await uploadSingleImage(req.file.buffer, {
          folder: `hotel_images/${category}`,
          resource_type: "image",
        });

        // Create image record
        const newImage = new Image({
          title,
          description,
          url: result.secure_url,
          category,
          alt: alt || title,
          position: parseInt(position),
          width: result.width,
          height: result.height,
          size: result.bytes,
          uploadedBy: req.user?.id, // Make it optional in case auth middleware is not present
        });

        await newImage.save();
        await newImage.populate("uploadedBy", "name email");

        res.status(201).json({
          success: true,
          message: "Upload hình ảnh thành công",
          data: newImage,
        });
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return next(new ApiError(500, "Lỗi khi upload hình ảnh"));
      }
    });
  } catch (error) {
    console.error("Upload image error:", error);
    return next(new ApiError(500, "Lỗi khi xử lý upload"));
  }
};

// Update image
exports.updateImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, alt, position, isActive } = req.body;

    const image = await Image.findById(id);
    if (!image) {
      return next(new ApiError(404, "Không tìm thấy hình ảnh"));
    }

    // Update fields
    if (title) image.title = title;
    if (description !== undefined) image.description = description;
    if (category) image.category = category;
    if (alt !== undefined) image.alt = alt;
    if (position !== undefined) image.position = parseInt(position);
    if (isActive !== undefined) image.isActive = isActive;

    await image.save();
    await image.populate("uploadedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Cập nhật hình ảnh thành công",
      data: image,
    });
  } catch (error) {
    console.error("Update image error:", error);
    return next(new ApiError(500, "Lỗi khi cập nhật hình ảnh"));
  }
};

// Delete image
exports.deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const image = await Image.findById(id);
    if (!image) {
      return next(new ApiError(404, "Không tìm thấy hình ảnh"));
    }

    // Delete from Cloudinary
    try {
      const publicId = image.url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(
        `hotel_images/${image.category}/${publicId}`
      );
    } catch (cloudinaryError) {
      console.error("Cloudinary delete error:", cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await Image.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Xóa hình ảnh thành công",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    return next(new ApiError(500, "Lỗi khi xóa hình ảnh"));
  }
};

// Bulk update positions
exports.updatePositions = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of {id, position}

    if (!Array.isArray(updates)) {
      return next(new ApiError(400, "Dữ liệu cập nhật không hợp lệ"));
    }

    const bulkOps = updates.map(({ id, position }) => ({
      updateOne: {
        filter: { _id: id },
        update: { position: parseInt(position) },
      },
    }));

    await Image.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: "Cập nhật thứ tự thành công",
    });
  } catch (error) {
    console.error("Update positions error:", error);
    return next(new ApiError(500, "Lỗi khi cập nhật thứ tự"));
  }
};

// Get categories with image counts
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Image.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return next(new ApiError(500, "Lỗi khi lấy danh sách danh mục"));
  }
};
