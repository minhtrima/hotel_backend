import React, { useState } from "react";
import { FiEdit3, FiSave, FiX } from "react-icons/fi";

export default function IssueStatusManager({ task, onUpdate, userPosition }) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);

  // Chỉ quản lý mới được phép chỉnh sửa trạng thái sự cố
  const canEditStatus = userPosition === "manager";

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onUpdate(updatedTask);
        setIsEditing(false);
      } else {
        alert("Có lỗi khi cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Có lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStatus(task.status);
    setIsEditing(false);
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
        return "bg-gray-100 text-gray-800";
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

  const getCategoryColor = (category) => {
    switch (category) {
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      case "guest-complaint":
        return "bg-red-100 text-red-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Hiển thị thông tin sự cố nếu có
  if (task.issue && task.issue.category) {
    return (
      <div className="border rounded-lg p-4 bg-orange-50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Báo cáo sự cố</h4>
            <span
              className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                task.issue.category
              )}`}
            >
              {getCategoryLabel(task.issue.category)}
            </span>
          </div>

          {canEditStatus && (
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                >
                  <FiEdit3 className="w-4 h-4" />
                  <span className="text-sm">Sửa trạng thái</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    <FiSave className="w-4 h-4" />
                    <span className="text-sm">Lưu</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                  >
                    <FiX className="w-4 h-4" />
                    <span className="text-sm">Hủy</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mô tả sự cố */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">Mô tả:</p>
          <p className="text-sm text-gray-800">{task.issue.description}</p>
        </div>

        {/* Hình ảnh sự cố */}
        {task.issue.images && task.issue.images.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Hình ảnh:</p>
            <div className="grid grid-cols-3 gap-2">
              {task.issue.images.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Issue ${index + 1}`}
                  className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                  onClick={() => window.open(imageUrl, "_blank")}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trạng thái */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Trạng thái:</span>
          {isEditing ? (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Chờ xử lý</option>
              <option value="in-progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          ) : (
            <span
              className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {getStatusLabel(task.status)}
            </span>
          )}
        </div>

        {!canEditStatus && (
          <p className="text-xs text-gray-500 mt-2">
            * Chỉ quản lý mới có thể thay đổi trạng thái sự cố
          </p>
        )}
      </div>
    );
  }

  return null;
}
