import React, { useState, useEffect } from "react";
import { FiImage, FiX, FiAlertCircle, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function IssueReport() {
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
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const staffId =
    currentUser?.user?.staffId?._id || currentUser?.staffId?._id || "";

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/room");
      if (response.ok) {
        const data = await response.json();
        console.log(data);

        // Chỉ hiển thị phòng có status available
        const availableRooms = data.rooms.filter(
          (room) => room.status === "available"
        );
        setRooms(availableRooms);
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
          reportedBy: staffId,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert("Báo cáo sự cố thành công!");
          navigate("/task");
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/task")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </button>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FiAlertCircle className="w-8 h-8 mr-3 text-orange-500" />
          Báo cáo sự cố
        </h1>
      </div>

      {/* Form Card */}
      <div className="max-w-3xl bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chọn phòng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phòng <span className="text-red-500">*</span>
            </label>
            <select
              name="roomId"
              value={formData.roomId}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại sự cố
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="maintenance">Bảo trì</option>
              <option value="guest-complaint">Khiếu nại khách hàng</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Mô tả ngắn gọn sự cố"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Mô tả chi tiết về sự cố..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Upload ảnh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className={`px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center space-x-2 transition-colors ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FiImage className="w-5 h-5" />
                <span>{uploading ? "Đang upload..." : "Chọn ảnh"}</span>
              </label>
            </div>

            {/* Hiển thị ảnh đã upload */}
            {formData.images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Issue ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-md"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/task")}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
