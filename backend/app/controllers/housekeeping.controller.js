const Room = require("../models/room");
const Task = require("../models/task");
const Staff = require("../models/staff");

// Lấy danh sách phòng được phân công cho nhân viên housekeeping
const getAssignedRooms = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Lấy các task đang được assign cho nhân viên này
    const tasks = await Task.find({
      assignedTo: staffId,
      status: { $in: ["pending", "in-progress"] },
    }).populate("roomId");

    // Lấy danh sách roomId từ tasks
    const roomIds = tasks.map((task) => task.roomId._id);

    // Lấy thông tin chi tiết của các phòng
    const rooms = await Room.find({
      _id: { $in: roomIds },
    }).populate("typeid");

    // Gộp thông tin room với task tương ứng
    const roomsWithTasks = rooms.map((room) => {
      const roomTask = tasks.find(
        (task) => task.roomId._id.toString() === room._id.toString()
      );
      return {
        ...room.toObject(),
        currentTask: roomTask,
      };
    });

    res.status(200).json({
      success: true,
      rooms: roomsWithTasks,
      totalRooms: roomsWithTasks.length,
    });
  } catch (error) {
    console.error("Error fetching assigned rooms:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách phòng",
      error: error.message,
    });
  }
};

// Cập nhật trạng thái housekeeping của phòng
const updateHousekeepingStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { housekeepingStatus, doNotDisturb, note } = req.body;

    const room = await Room.findByIdAndUpdate(
      roomId,
      {
        ...(housekeepingStatus && { housekeepingStatus }),
        ...(doNotDisturb !== undefined && { doNotDisturb }),
      },
      { new: true, runValidators: true }
    ).populate("typeid");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phòng",
      });
    }

    // Nếu có note, cập nhật task liên quan
    if (note) {
      await Task.findOneAndUpdate(
        {
          roomId: roomId,
          status: { $in: ["pending", "in-progress"] },
        },
        {
          note: note,
          ...(housekeepingStatus === "clean" && {
            status: "completed",
            completedAt: new Date(),
          }),
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái phòng thành công",
      room,
    });
    // Emit socket events so mobile clients can refresh
    try {
      const io = req.app && req.app.get("io");
      if (io) {
        io.emit("rooms:housekeeping:update", {
          roomId: room._id,
          housekeepingStatus: room.housekeepingStatus,
        });
        io.emit("tasks:refresh", { roomId: room._id });
      }
    } catch (emitErr) {
      console.error(
        "Error emitting socket events in updateHousekeepingStatus:",
        emitErr
      );
    }
  } catch (error) {
    console.error("Error updating housekeeping status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái phòng",
      error: error.message,
    });
  }
};

// Bắt đầu công việc dọn phòng
const startCleaning = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { staffId } = req.body;

    // Cập nhật trạng thái phòng thành cleaning
    const room = await Room.findByIdAndUpdate(
      roomId,
      { housekeepingStatus: "cleaning" },
      { new: true }
    );

    // Cập nhật task thành in-progress
    const task = await Task.findOneAndUpdate(
      {
        roomId: roomId,
        assignedTo: staffId,
        status: "pending",
      },
      {
        status: "in-progress",
        startTime: new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Đã bắt đầu dọn phòng",
      room,
      task,
    });
    // Emit socket events so mobile clients can refresh
    try {
      const io = req.app && req.app.get("io");
      if (io) {
        io.emit("rooms:housekeeping:update", {
          roomId: room._id,
          housekeepingStatus: room.housekeepingStatus,
        });
        io.emit("tasks:refresh", { roomId: room._id });
      }
    } catch (emitErr) {
      console.error("Error emitting socket events in startCleaning:", emitErr);
    }
  } catch (error) {
    console.error("Error starting cleaning:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi bắt đầu dọn phòng",
      error: error.message,
    });
  }
};

// Hoàn thành công việc dọn phòng
const completeCleaning = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { staffId, note, issues } = req.body;

    // Cập nhật trạng thái phòng
    const room = await Room.findByIdAndUpdate(
      roomId,
      {
        housekeepingStatus: issues && issues.length > 0 ? "dirty" : "clean",
      },
      { new: true }
    );

    // Hoàn thành task
    const task = await Task.findOneAndUpdate(
      {
        roomId: roomId,
        assignedTo: staffId,
        status: "in-progress",
      },
      {
        status: "completed",
        completedAt: new Date(),
        note: note || "",
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Đã hoàn thành dọn phòng",
      room,
      task,
    });
    // Emit socket events so mobile clients can refresh
    try {
      const io = req.app && req.app.get("io");
      if (io) {
        io.emit("rooms:housekeeping:update", {
          roomId: room._id,
          housekeepingStatus: room.housekeepingStatus,
        });
        io.emit("tasks:refresh", { roomId: room._id });
      }
    } catch (emitErr) {
      console.error(
        "Error emitting socket events in completeCleaning:",
        emitErr
      );
    }
  } catch (error) {
    console.error("Error completing cleaning:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi hoàn thành dọn phòng",
      error: error.message,
    });
  }
};

module.exports = {
  getAssignedRooms,
  updateHousekeepingStatus,
  startCleaning,
  completeCleaning,
};
