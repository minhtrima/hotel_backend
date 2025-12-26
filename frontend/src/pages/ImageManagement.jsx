import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaImages,
  FaUpload,
} from "react-icons/fa";
import DataTable from "../components/DataTable";
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

export default function ImageManagement() {
  const navigate = useNavigate();
  const { canViewImages, canCreateImages, canEditImages, canDeleteImages } =
    usePermissions();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/images?${params}`);
      const data = await response.json();

      if (data.success) {
        setImages(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Lỗi khi tải danh sách hình ảnh");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, page]);

  // Separate permission check
  useEffect(() => {
    if (!canViewImages) {
      navigate("/unauthorized");
    }
  }, [canViewImages, navigate]);

  // Data fetching effect
  useEffect(() => {
    if (canViewImages) {
      fetchImages();
    }
  }, [fetchImages, canViewImages]);

  const handleToggleActive = async (id, currentStatus) => {
    if (!canEditImages) {
      alert("Bạn không có quyền chỉnh sửa hình ảnh");
      return;
    }

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchImages();
      } else {
        alert(data.message || "Lỗi khi cập nhật trạng thái");
      }
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
      console.error(err);
    }
  };

  const handleDelete = async (id, title) => {
    if (!canDeleteImages) {
      alert("Bạn không có quyền xóa hình ảnh");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa hình ảnh "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        fetchImages();
        alert("Xóa hình ảnh thành công");
      } else {
        alert(data.message || "Lỗi khi xóa hình ảnh");
      }
    } catch (err) {
      alert("Lỗi khi xóa hình ảnh");
      console.error(err);
    }
  };

  const columns = [
    {
      id: "preview",
      header: "Hình Ảnh",
      accessorKey: "url",
      cell: ({ row }) => (
        <div className="flex items-center">
          <img
            src={row.original.url}
            alt={row.original.alt || row.original.title}
            className="w-16 h-16 object-cover rounded-lg shadow-md"
          />
        </div>
      ),
    },
    {
      id: "title",
      header: "Tiêu Đề",
      accessorKey: "title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          {row.original.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "category",
      header: "Danh Mục",
      accessorKey: "category",
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {CATEGORIES[row.original.category] || row.original.category}
        </span>
      ),
    },
    {
      id: "position",
      header: "Thứ Tự",
      accessorKey: "position",
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-gray-100 rounded">
          {row.original.position}
        </span>
      ),
    },
    {
      id: "isActive",
      header: "Trạng Thái",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <button
          onClick={() =>
            handleToggleActive(row.original._id, row.original.isActive)
          }
          className={`flex items-center px-3 py-1 rounded-full text-sm ${
            row.original.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
          disabled={!canEditImages}
        >
          {row.original.isActive ? (
            <FaEye className="mr-1" />
          ) : (
            <FaEyeSlash className="mr-1" />
          )}
          {row.original.isActive ? "Hiển thị" : "Ẩn"}
        </button>
      ),
    },
    {
      id: "createdAt",
      header: "Ngày Tạo",
      accessorKey: "createdAt",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("vi-VN"),
    },
    {
      id: "actions",
      header: "Thao Tác",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/images/${row.original._id}`)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
            title="Xem chi tiết"
          >
            <FaEye />
          </button>
          {canEditImages && (
            <button
              onClick={() => navigate(`/images/${row.original._id}/edit`)}
              className="p-2 text-green-600 hover:bg-green-100 rounded"
              title="Chỉnh sửa"
            >
              <FaEdit />
            </button>
          )}
          {canDeleteImages && (
            <button
              onClick={() => handleDelete(row.original._id, row.original.title)}
              className="p-2 text-red-600 hover:bg-red-100 rounded"
              title="Xóa"
            >
              <FaTrash />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FaImages className="text-2xl text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Hình Ảnh</h1>
        </div>
        {canCreateImages && (
          <button
            onClick={() => navigate("/images/upload")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaUpload />
            Tải Lên Hình Ảnh
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, mô tả..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả danh mục</option>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <DataTable
          columns={columns}
          data={images}
          loading={loading}
          emptyMessage="Không có hình ảnh nào"
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-3 py-2">
              Trang {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
