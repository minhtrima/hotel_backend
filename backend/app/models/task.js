const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff", // Lễ tân hoặc Quản lý
    required: true,
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff", // Nhân viên buồng phòng
    required: true,
  },

  taskType: {
    type: String,
    enum: [
      "cleaning",
      "laundry",
      "refill",
      "inspection",
      "other",
      "issue-report ",
    ],
    default: "cleaning",
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  reportBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff", // Nhân viên buồng phòng báo cáo
  },

  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "cancelled"],
    default: "pending",
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  startTime: {
    type: Date, // Khi nhân viên bắt đầu làm
  },

  completedAt: {
    type: Date, // Khi nhân viên hoàn thành
  },

  issue: {
    category: {
      type: String,
      enum: ["maintenance", "guest-complaint", "other"],
    },
    description: String,
    images: [String],
  },

  note: {
    type: String, // Ghi chú của nhân viên buồng phòng sau khi hoàn thành
  },
});

module.exports = mongoose.model("Task", TaskSchema);
