import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiClock,
  FiUser,
  FiFileText,
  FiImage,
} from "react-icons/fi";
import LoadingPage from "../components/Loading";
import { usePermissions } from "../hooks/usePermissions";
import NotificationModal from "../components/NotificationModal";

const formatDateTime = (date) => {
  if (!date) return "Chưa có";
  const d = new Date(date);
  return (
    d.toLocaleDateString("vi-VN") +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
};

export default function IssueReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const permissions = usePermissions();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
    title: "Thông báo",
  });

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${id}`);
      if (!response.ok) throw new Error("Failed to fetch task");
      const data = await response.json();
      console.log(data);
      setTask(data);
      setStatusNote(data.note || "");
    } catch (err) {
      console.error("Error loading task:", err);
      setError("Không thể tải thông tin sự cố.");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (newStatus) => {
    if (!permissions.canEditTask) {
      setNotification({
        isOpen: true,
        message: "Bạn không có quyền cập nhật trạng thái",
        title: "Lỗi",
      });
      return;
    }

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
      setNotification({
        isOpen: true,
        message: "Cập nhật trạng thái thành công!",
        title: "Thành công",
      });
    } catch (err) {
      console.error("Error updating task status:", err);
      setNotification({
        isOpen: true,
        message: "Không thể cập nhật trạng thái sự cố.",
        title: "Lỗi",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "maintenance":
        return "Bảo trì";
      case "guest-complaint":
        return "Khiếu nại khách hàng";
      case "other":
        return "Khác";
      default:
        return category;
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <LoadingPage />;
  if (error)
    return <div className="p-6 text-red-500 font-semibold">{error}</div>;
  if (!task) return <div className="p-6">Không tìm thấy sự cố.</div>;

  const issue = task.issue || {};

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/issue-report")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 mr-2" />
          Quay lại danh sách
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FiAlertCircle className="w-8 h-8 mr-3 text-orange-500" />
            Chi tiết sự cố
          </h1>
          <span
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(
              task.status
            )}`}
          >
            {getStatusLabel(task.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin cơ bản */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiFileText className="w-5 h-5 mr-2 text-blue-500" />
              Thông tin sự cố
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Tiêu đề
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {task.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phòng
                  </label>
                  <p className="text-gray-900 font-medium">
                    {task.roomId?.roomNumber || "Không rõ"}
                  </p>
                  {task.roomId?.typeid?.name && (
                    <p className="text-sm text-gray-500">
                      {task.roomId.typeid.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Loại sự cố
                  </label>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    {getCategoryLabel(issue.category)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Mô tả chi tiết
                </label>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {task.description || "Không có mô tả"}
                </p>
              </div>
            </div>
          </div>

          {/* Hình ảnh */}
          {issue.images && issue.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FiImage className="w-5 h-5 mr-2 text-purple-500" />
                Hình ảnh ({issue.images.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {issue.images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Issue ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        Xem lớn
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ghi chú */}
          {task.note && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Ghi chú xử lý
              </h2>
              <p className="text-gray-900 whitespace-pre-wrap bg-blue-50 p-4 rounded-lg">
                {task.note}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cập nhật trạng thái */}
          {permissions.canEditTask && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Cập nhật trạng thái
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái hiện tại
                  </label>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm font-semibold text-center ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú xử lý
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Thêm ghi chú về quá trình xử lý..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="space-y-2">
                  {task.status !== "in-progress" && (
                    <button
                      onClick={() => updateTaskStatus("in-progress")}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {updating ? "Đang cập nhật..." : "Bắt đầu xử lý"}
                    </button>
                  )}

                  {task.status !== "completed" && (
                    <button
                      onClick={() => updateTaskStatus("completed")}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {updating ? "Đang cập nhật..." : "Hoàn thành"}
                    </button>
                  )}

                  {task.status !== "cancelled" && (
                    <button
                      onClick={() => updateTaskStatus("cancelled")}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {updating ? "Đang cập nhật..." : "Hủy bỏ"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Thông tin thời gian */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiClock className="w-5 h-5 mr-2 text-green-500" />
              Thời gian
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Thời gian tạo
                </label>
                <p className="text-gray-900">
                  {formatDateTime(task.createdAt)}
                </p>
              </div>

              {task.startTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Bắt đầu xử lý
                  </label>
                  <p className="text-gray-900">
                    {formatDateTime(task.startTime)}
                  </p>
                </div>
              )}

              {task.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Hoàn thành
                  </label>
                  <p className="text-gray-900">
                    {formatDateTime(task.completedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin người xử lý */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiUser className="w-5 h-5 mr-2 text-indigo-500" />
              Người liên quan
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Người báo cáo
                </label>
                <p className="text-gray-900 font-medium">
                  {task.reportBy?.name || "Không rõ"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xem ảnh lớn */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Issue detail"
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        title={notification.title}
        onClose={() =>
          setNotification({ isOpen: false, message: "", title: "Thông báo" })
        }
      />
    </div>
  );
}
