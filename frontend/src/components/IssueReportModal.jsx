import React, { useState, useEffect } from "react";
import { FiImage, FiX, FiAlert } from "react-icons/fi";

export default function IssueReportModal({
  isOpen,
  onClose,
  onSubmit,
  getStaffId,
}) {
  const [formData, setFormData] = useState({
    roomId: "",
    title: "",
    description: "",
    category: "maintenance",
    images: [],
  });
  const [rooms, setRooms] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      // Reset form when modal opens
      setFormData({
        roomId: "",
        title: "",
        description: "",
        category: "maintenance",
        images: [],
      });
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedImages = [];

    try {
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);

        const response = await fetch("/api/tasks/upload-issue-image", {
          method: "POST",
          body: formDataUpload,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            uploadedImages.push(result.data.url);
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Có lỗi khi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.roomId || !formData.title || !formData.description) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tasks/report-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          reportedBy: getStaffId ? getStaffId() : undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onSubmit(result.data);
          onClose();
        } else {
          alert(result.message || "Có lỗi khi gửi báo cáo");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Có lỗi khi gửi báo cáo");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Có lỗi khi gửi báo cáo sự cố");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FiAlert className="w-5 h-5 mr-2 text-orange-500" />
            Báo cáo sự cố
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chọn phòng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phòng <span className="text-red-500">*</span>
            </label>
            <select
              name="roomId"
              value={formData.roomId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn phòng</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomNumber} - {room.typeid?.name || "Không rõ loại"}
                </option>
              ))}
            </select>
          </div>

          {/* Loại sự cố */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại sự cố
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="maintenance">Bảo trì</option>
              <option value="guest-complaint">Khiếu nại khách hàng</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Mô tả ngắn gọn sự cố"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Mô tả chi tiết về sự cố..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Upload ảnh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh (tùy chọn)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`px-3 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 flex items-center space-x-2 ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FiImage className="w-4 h-4" />
                <span>{uploading ? "Đang upload..." : "Chọn ảnh"}</span>
              </label>
            </div>

            {/* Hiển thị ảnh đã upload */}
            {formData.images.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={imageUrl}
                      alt={`Issue ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
