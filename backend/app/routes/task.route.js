const express = require("express");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTasksByStaff,
  reportIssue,
  uploadIssueImage,
} = require("../controllers/task.controller");

const router = express.Router();

// Tạo công việc mới
router.post("/", createTask);

// Upload ảnh cho báo cáo sự cố
router.post("/upload-issue-image", uploadIssueImage);

// Báo cáo sự cố
router.post("/report-issue", reportIssue);

// Lấy danh sách công việc
router.get("/", getTasks);

// Lấy tasks theo staffId để mobile app hiển thị công việc của nhân viên
router.get("/staff/:staffId", getTasksByStaff);

// Chi tiết công việc
router.get("/:id", getTaskById);

// Cập nhật thông tin công việc
router.put("/:id", updateTask);

// Cập nhật trạng thái công việc
router.patch("/:id/status", updateTaskStatus);
router.put("/:id/status", updateTaskStatus);

// Xóa công việc
router.delete("/:id", deleteTask);

module.exports = router;
