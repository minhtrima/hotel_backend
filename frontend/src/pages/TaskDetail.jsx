import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiEdit3,
  FiTrash2,
  FiArrowLeft,
  FiClock,
  FiUser,
  FiFileText,
} from "react-icons/fi";
import LoadingPage from "../components/Loading";

const formatDateTime = (date) => {
  if (!date) return "Chưa có";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN");
};

export default function TaskDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${id}`);
      if (!response.ok) throw new Error("Failed to fetch task");
      const data = await response.json();
      setTask(data);
      setStatusNote(data.note || "");
    } catch (err) {
      console.error("Error loading task:", err);
      setError("Không thể tải thông tin công việc.");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote,
        }),
      });

      if (!response.ok) throw new Error("Failed to update task status");
      const updatedTask = await response.json();
      setTask(updatedTask);
    } catch (err) {
      console.error("Error updating task status:", err);
      setError("Không thể cập nhật trạng thái công việc.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa công việc này?")) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");
      navigate("/task");
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Không thể xóa công việc.");
    }
  };

  const getTaskTypeLabel = (taskType) => {
    switch (taskType) {
      case "cleaning":
        return "Dọn phòng";
      case "laundry":
        return "Giặt ủi";
      case "refill":
        return "Bổ sung vật tư";
      case "inspection":
        return "Kiểm tra";
      case "other":
        return "Khác";
      default:
        return taskType;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "in-progress":
        return "Đang thực hiện";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "low":
        return "Thấp";
      case "medium":
        return "Trung bình";
      case "high":
        return "Cao";
      default:
        return priority;
    }
  };

  if (loading) return <LoadingPage />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!task) return <div className="p-6">Không tìm thấy công việc.</div>;

  const canUpdateStatus =
    task.status !== "completed" && task.status !== "cancelled";

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/task")}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Chi tiết công việc
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-2"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin cơ bản */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiFileText className="w-5 h-5 mr-2" />
            Thông tin cơ bản
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Tiêu đề:</span>
              <span className="ml-2 font-medium">
                {task.title || "Chưa có tiêu đề"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Phòng:</span>
              <span className="ml-2 font-medium">
                {task.roomId?.roomNumber || "Không rõ"}
                {task.roomId?.typeid?.name && ` - ${task.roomId.typeid.name}`}
                {task.roomId?.type && ` - ${task.roomId.type}`}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Loại công việc:</span>
              <span className="ml-2 font-medium">
                {getTaskTypeLabel(task.taskType)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Độ ưu tiên:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${
                  task.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : task.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {getPriorityLabel(task.priority)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Trạng thái:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${
                  task.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : task.status === "in-progress"
                    ? "bg-blue-100 text-blue-800"
                    : task.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {getStatusLabel(task.status)}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-gray-600">Mô tả:</span>
            <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded">
              {task.description}
            </p>
          </div>
        </div>

        {/* Thông tin nhân viên */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiUser className="w-5 h-5 mr-2" />
            Phân công
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Người giao việc:</span>
              <span className="ml-2 font-medium">
                {task.assignedBy?.name || "Không rõ"}
                {task.assignedBy?.role && ` (${task.assignedBy.role})`}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Được giao cho:</span>
              <span className="ml-2 font-medium">
                {task.assignedTo?.name || "Không rõ"}
                {task.assignedTo?.role && ` (${task.assignedTo.role})`}
              </span>
            </div>
          </div>
        </div>

        {/* Thời gian */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiClock className="w-5 h-5 mr-2" />
            Thời gian
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Thời gian tạo:</span>
              <span className="ml-2 font-medium">
                {formatDateTime(task.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Bắt đầu:</span>
              <span className="ml-2 font-medium">
                {formatDateTime(task.startTime)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Hoàn thành:</span>
              <span className="ml-2 font-medium">
                {formatDateTime(task.completedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Cập nhật trạng thái */}
        {canUpdateStatus && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Cập nhật trạng thái</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Thêm ghi chú (không bắt buộc)..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {task.status === "pending" && (
                <button
                  onClick={() => updateTaskStatus("in-progress")}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Bắt đầu làm
                </button>
              )}

              {task.status === "in-progress" && (
                <>
                  <button
                    onClick={() => updateTaskStatus("completed")}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Hoàn thành
                  </button>
                  <button
                    onClick={() => updateTaskStatus("pending")}
                    disabled={updating}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    Tạm dừng
                  </button>
                </>
              )}

              <button
                onClick={() => updateTaskStatus("cancelled")}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        )}

        {/* Ghi chú */}
        {task.note && (
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
            <p className="text-gray-800 bg-gray-50 p-3 rounded">{task.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
