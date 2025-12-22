const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "banner", // Hình banner trang chủ
        "hero", // Hình hero section
        "gallery", // Thư viện ảnh
        "room", // Ảnh phòng mẫu
        "service", // Ảnh dịch vụ
        "facility", // Ảnh tiện ích
        "about", // Ảnh về chúng tôi
      ],
    },
    position: {
      type: Number,
      default: 0, // Thứ tự hiển thị
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    alt: {
      type: String, // Alt text cho SEO
      trim: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    size: {
      type: Number, // File size in bytes
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make optional since auth middleware not implemented yet
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
ImageSchema.index({ category: 1, isActive: 1, position: 1 });
ImageSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Image", ImageSchema);
