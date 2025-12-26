import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUpload, FaImage, FaTimes } from "react-icons/fa";
import BackArrow from "../components/BackArrow";
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

export default function ImageUpload() {
  const navigate = useNavigate();
  const { canCreateImages } = usePermissions();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "banner",
    alt: "",
    position: 0,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (!canCreateImages) {
      navigate("/unauthorized");
    }
  }, [canCreateImages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors({ file: "Vui lòng chọn file hình ảnh" });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ file: "File không được vượt quá 10MB" });
      return;
    }

    setSelectedFile(file);
    setErrors({});

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Auto-fill title if empty
    if (!formData.title) {
      setFormData((prev) => ({
        ...prev,
        title: file.name.split(".")[0],
        alt: file.name.split(".")[0],
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    }

    if (!formData.category) {
      newErrors.category = "Danh mục là bắt buộc";
    }

    if (!selectedFile) {
      newErrors.file = "Vui lòng chọn file hình ảnh";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", selectedFile);
      uploadData.append("title", formData.title.trim());
      uploadData.append("description", formData.description.trim());
      uploadData.append("category", formData.category);
      uploadData.append("alt", formData.alt.trim() || formData.title.trim());
      uploadData.append("position", formData.position.toString());

      const response = await fetch("/api/images/upload", {
        method: "POST",
        credentials: "include",
        body: uploadData,
      });

      const data = await response.json();

      if (data.success) {
        alert("Upload hình ảnh thành công!");
        navigate("/images");
      } else {
        setErrors({ general: data.message || "Lỗi khi upload hình ảnh" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrors({ general: "Lỗi khi upload hình ảnh" });
    } finally {
      setUploading(false);
    }
  };

  const removePreview = () => {
    setSelectedFile(null);
    setPreview(null);
    setErrors((prev) => ({ ...prev, file: "" }));
  };

  return (
    <>
      <BackArrow to="/images" />
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <FaUpload className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Tải Lên Hình Ảnh
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn Hình Ảnh *
              </label>

              {!preview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <FaImage className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    Kéo thả file hoặc click để chọn hình ảnh
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="fileInput"
                  />
                  <label
                    htmlFor="fileInput"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Chọn File
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removePreview}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              {errors.file && (
                <p className="text-red-600 text-sm mt-1">{errors.file}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu Đề *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tiêu đề hình ảnh"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô Tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả ngắn về hình ảnh"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh Mục *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Text (SEO)
              </label>
              <input
                type="text"
                name="alt"
                value={formData.alt}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả hình ảnh cho SEO"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thứ Tự Hiển Thị
              </label>
              <input
                type="number"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Số nhỏ hơn sẽ hiển thị trước. Mặc định là 0.
              </p>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/images")}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Đang Upload..." : "Upload Hình Ảnh"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
