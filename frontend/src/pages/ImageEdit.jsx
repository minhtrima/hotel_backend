import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSave, FaUpload } from "react-icons/fa";
import { usePermissions } from "../hooks/usePermissions";

const CATEGORIES = {
  banner: "Banner Trang Chủ",
  hero: "Hình Hero",
  gallery: "Thư Viện",
  room: "Phòng Mẫu",
  service: "Dịch Vụ",
  facility: "Tiện Ích",
  about: "Về Chúng Tôi",
};

export default function ImageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEditImages } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "banner",
    alt: "",
    position: 0,
    isActive: true,
  });
  const [originalImage, setOriginalImage] = useState(null);

  useEffect(() => {
    if (!canEditImages) {
      navigate("/unauthorized");
      return;
    }
    fetchImage();
  }, [id, canEditImages]);

  const fetchImage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/images/${id}`);
      const data = await response.json();

      if (data.success) {
        const image = data.data;
        setOriginalImage(image);
        setFormData({
          title: image.title || "",
          description: image.description || "",
          category: image.category || "banner",
          alt: image.alt || "",
          position: image.position || 0,
          isActive: image.isActive ?? true,
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Lỗi khi tải thông tin hình ảnh");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/images/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert("Cập nhật hình ảnh thành công");
        navigate(`/images/${id}`);
      } else {
        alert(data.message || "Lỗi khi cập nhật hình ảnh");
      }
    } catch (err) {
      alert("Lỗi khi cập nhật hình ảnh");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/images/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft />
            Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Chỉnh Sửa Hình Ảnh
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Preview */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Xem Trước</h3>
              {originalImage && (
                <img
                  src={originalImage.url}
                  alt={formData.alt || formData.title}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              )}
            </div>

            {/* Image Info */}
            {originalImage && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">Thông Tin File</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kích thước:</span>
                    <span>
                      {originalImage.width} x {originalImage.height} px
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dung lượng:</span>
                    <span>
                      {(originalImage.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày tải lên:</span>
                    <span>
                      {new Date(originalImage.createdAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Thông Tin Chi Tiết</h3>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tiêu đề hình ảnh"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mô tả hình ảnh"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text (SEO)
                  </label>
                  <input
                    type="text"
                    name="alt"
                    value={formData.alt}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mô tả ngắn gọn cho SEO"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Số thứ tự hiển thị (0 = đầu tiên)
                  </p>
                </div>

                {/* Is Active */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Hiển thị công khai
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(`/images/${id}`)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
