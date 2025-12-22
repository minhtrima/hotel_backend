const Task = require("../models/task");
const Room = require("../models/room");

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);

    // Nếu task liên quan đến housekeeping và status là 'cleaning', cập nhật room.housekeepingStatus
    try {
      const io = req.app && req.app.get("io");

      const roomId = task.roomId || req.body.roomId;
      const taskStatus = task.status || req.body.status;
      const taskType = task.taskType || req.body.taskType;

      if (roomId && taskType === "cleaning") {
        await Room.findByIdAndUpdate(roomId, {
          housekeepingStatus: "cleaning",
        });

        // Emit sự kiện để app phone có thể fetch lại dữ liệu
        if (io) {
          io.emit("rooms:housekeeping:update", {
            roomId,
            housekeepingStatus: "cleaning",
          });
          io.emit("tasks:refresh", { roomId });
        }
      }

      // Emit chung khi tạo task để các client có thể cập nhật
      if (io)
        io.emit("tasks:created", { taskId: task._id, roomId: task.roomId });
    } catch (emitErr) {
      console.error("Error emitting socket events after task create:", emitErr);
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const filter = {};

    if (req.query.roomId) filter.roomId = req.query.roomId;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.status) filter.status = req.query.status;

    const tasks = await Task.find(filter)
      .populate({
        path: "roomId",
        select: "roomNumber typeid",
        populate: {
          path: "typeid",
          select: "name",
        },
      })
      .populate("assignedBy", "name role")
      .populate("assignedTo", "name role")
      .populate("reportBy", "name role")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy tasks theo staffId để mobile app hiển thị công việc được giao
exports.getTasksByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const tasks = await Task.find({ assignedTo: staffId })
      .populate({
        path: "roomId",
        select: "roomNumber typeid status",
        populate: {
          path: "typeid",
          select: "name",
        },
      })
      .populate("assignedBy", "name role")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: "roomId",
        select: "roomNumber typeid",
        populate: {
          path: "typeid",
          select: "name",
        },
      })
      .populate("assignedBy", "name role")
      .populate("assignedTo", "name role")
      .populate("reportBy", "name role");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = status;
    if (status === "in-progress") task.startTime = new Date();
    if (status === "completed") {
      task.completedAt = new Date();

      // Nếu là issue report và hoàn thành, cập nhật room status về available
      if (task.taskType === "issue-report" && task.roomId) {
        await Room.findByIdAndUpdate(task.roomId, {
          status: "available",
        });
      }
    }
    if (note) task.note = note;

    await task.save();

    // Cập nhật housekeepingStatus của phòng nếu là task dọn phòng
    if (task.taskType === "cleaning" && task.roomId) {
      let housekeepingStatus;

      switch (status) {
        case "pending":
          housekeepingStatus = "dirty"; // Chờ dọn
          break;
        case "in-progress":
          housekeepingStatus = "cleaning"; // Đang dọn
          break;
        case "completed":
          housekeepingStatus = "clean"; // Đã dọn xong
          break;
        case "cancelled":
          housekeepingStatus = "dirty"; // Hủy, phòng vẫn chưa dọn
          break;
        default:
          housekeepingStatus = null;
      }

      if (housekeepingStatus) {
        await Room.findByIdAndUpdate(task.roomId, {
          housekeepingStatus: housekeepingStatus,
        });

        // Emit socket events để client cập nhật
        try {
          const io = req.app && req.app.get("io");
          if (io) {
            io.emit("rooms:housekeeping:update", {
              roomId: task.roomId,
              housekeepingStatus: housekeepingStatus,
            });
            io.emit("tasks:refresh", { roomId: task.roomId });
          }
        } catch (emitErr) {
          console.error(
            "Error emitting socket events in updateTaskStatus:",
            emitErr
          );
        }
      }
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload ảnh cho báo cáo sự cố
exports.uploadIssueImage = async (req, res) => {
  try {
    const multer = require("multer");
    const { uploadSingleImage } = require("../utils/cloudinaryUpload");

    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new Error("Chỉ chấp nhận file hình ảnh"), false);
        }
      },
    });

    upload.single("image")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn file hình ảnh",
        });
      }

      try {
        const result = await uploadSingleImage(req.file.buffer, {
          folder: "issue-reports",
          resource_type: "image",
        });

        res.json({
          success: true,
          data: {
            url: result.secure_url,
            publicId: result.public_id,
          },
        });
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Lỗi khi upload hình ảnh",
        });
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi upload ảnh",
    });
  }
};

// Báo cáo sự cố - tạo task với loại báo cáo sự cố
exports.reportIssue = async (req, res) => {
  try {
    const { roomId, title, description, category, images, reportedBy } =
      req.body;

    // Validation
    if (!roomId || !title || !description || !reportedBy) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc: phòng, tiêu đề, mô tả, người báo cáo",
      });
    }

    // Tạo task mới với thông tin sự cố
    const issueTask = new Task({
      title: title,
      roomId: roomId,
      assignedBy: reportedBy, // Người báo cáo sự cố
      assignedTo: reportedBy, // Tạm thời gán cho chính người báo cáo
      taskType: "issue-report", // Loại task khác
      description: description,
      reportBy: reportedBy,
      status: "pending",
      priority: category === "guest-complaint" ? "high" : "medium",
      issue: {
        category: category,
        description: description,
        images: images || [],
      },
    });

    const savedTask = await issueTask.save();

    // Nếu loại sự cố là bảo trì, cập nhật trạng thái phòng thành maintenance
    if (category === "maintenance") {
      await Room.findByIdAndUpdate(roomId, {
        status: "maintenance",
      });

      // Emit socket để client (mobile) biết room đã thay đổi
      try {
        const io = req.app && req.app.get("io");
        if (io) {
          io.emit("rooms:status:update", { roomId, status: "maintenance" });
          io.emit("tasks:refresh", { roomId });
        }
      } catch (emitErr) {
        console.error(
          "Error emitting socket events after reportIssue:",
          emitErr
        );
      }
    }

    // Populate thông tin để trả về
    const populatedTask = await Task.findById(savedTask._id)
      .populate("roomId", "roomNumber floor")
      .populate("assignedBy", "name role")
      .populate("reportBy", "name role");

    res.status(201).json({
      success: true,
      message: "Đã gửi báo cáo sự cố thành công",
      data: populatedTask,
    });
  } catch (err) {
    console.error("Error reporting issue:", err);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi gửi báo cáo sự cố",
    });
  }
};
