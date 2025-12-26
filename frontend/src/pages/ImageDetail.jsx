import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
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

export default function ImageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEditImages, canDeleteImages } = usePermissions();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImage();
  }, [id]);

  const fetchImage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/images/${id}`);
      const data = await response.json();

      if (data.success) {
        setImage(data.data);
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

  const handleToggleActive = async () => {
    if (!canEditImages) {
      alert("Bạn không có quyền chỉnh sửa hình ảnh");
      return;
    }

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !image.isActive }),
      });

      const data = await response.json();
      if (data.success) {
        setImage((prev) => ({ ...prev, isActive: !prev.isActive }));
      } else {
        alert(data.message || "Lỗi khi cập nhật trạng thái");
      }
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteImages) {
      alert("Bạn không có quyền xóa hình ảnh");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa hình ảnh "${image.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        alert("Xóa hình ảnh thành công");
        navigate("/images");
      } else {
        alert(data.message || "Lỗi khi xóa hình ảnh");
      }
    } catch (err) {
      alert("Lỗi khi xóa hình ảnh");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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

  if (!image) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Không tìm thấy hình ảnh
          </h2>
          <Link to="/images" className="text-blue-600 hover:underline">
            Quay lại danh sách
          </Link>
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
            onClick={() => navigate("/images")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft />
            Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Chi Tiết Hình Ảnh
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              image.isActive
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
            disabled={!canEditImages}
          >
            {image.isActive ? <FaEyeSlash /> : <FaEye />}
            {image.isActive ? "Ẩn" : "Hiển thị"}
          </button>

          {canEditImages && (
            <button
              onClick={() => navigate(`/images/${id}/edit`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <FaEdit />
              Chỉnh Sửa
            </button>
          )}

          {canDeleteImages && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <FaTrash />
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <img
              src={image.url}
              alt={image.alt || image.title}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>

          {/* Image info */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Thông Tin Kỹ Thuật</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Kích thước:</span>
                <p className="font-medium">
                  {image.width} x {image.height} px
                </p>
              </div>
              <div>
                <span className="text-gray-600">Dung lượng:</span>
                <p className="font-medium">
                  {(image.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <span className="text-gray-600">Thứ tự:</span>
                <p className="font-medium">{image.position}</p>
              </div>
              <div>
                <span className="text-gray-600">Trạng thái:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    image.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {image.isActive ? "Hiển thị" : "Ẩn"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Thông Tin Chi Tiết</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                  {image.title}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded border min-h-[80px]">
                  {image.description || "Không có mô tả"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <p className="text-gray-900">
                  <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {CATEGORIES[image.category] || image.category}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt text (SEO)
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                  {image.alt || "Không có alt text"}
                </p>
              </div>

              {image.uploadedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người tải lên
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                    {image.uploadedBy.name || image.uploadedBy.email}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tạo
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded border text-sm">
                    {new Date(image.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cập nhật lần cuối
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded border text-sm">
                    {new Date(image.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
