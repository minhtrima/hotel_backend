import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xl ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
      <span className="ml-2 text-sm font-medium">({rating}/5)</span>
    </div>
  );
};

export default function Review() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({
    isVisible: "",
    rating: "",
  });

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.isVisible !== "") params.append("isVisible", filter.isVisible);
      if (filter.rating) params.append("rating", filter.rating);

      console.log("Fetching reviews with params:", params.toString());
      const response = await fetch(`/api/reviews?${params.toString()}`);
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Reviews data:", data);

      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        console.error("API returned success: false", data);
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log("Fetching stats...");
      const response = await fetch("/api/reviews/stats");
      console.log("Stats response status:", response.status);
      const data = await response.json();
      console.log("Stats data:", data);
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleToggleVisibility = async (reviewId) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/toggle`, {
        method: "PUT",
      });
      const data = await response.json();

      if (data.success) {
        fetchReviews();
        alert(data.message);
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        fetchReviews();
        fetchStats();
        alert("Xóa đánh giá thành công");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Có lỗi xảy ra khi xóa đánh giá");
    }
  };

  const columns = [
    {
      header: "Mã đặt phòng",
      accessorFn: (row) => row.bookingSnapshot?.bookingCode || "N/A",
      cell: (info) => info.getValue(),
    },
    {
      header: "Đánh giá",
      accessorFn: (row) => row.rating,
      cell: (info) => <StarRating rating={info.getValue()} />,
    },
    {
      header: "Ngày tạo",
      accessorFn: (row) => row.createdAt,
      cell: (info) => formatDate(info.getValue()),
    },
    {
      header: "Trạng thái",
      accessorFn: (row) => row.isVisible,
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue()
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {info.getValue() ? "Hiển thị" : "Đã ẩn"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      accessorFn: (row) => row._id,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/review/${row._id}`)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Chi tiết
            </button>
            <button
              onClick={() => handleToggleVisibility(row._id, row.isVisible)}
              className={`px-3 py-1 rounded text-sm text-white ${
                row.isVisible
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {row.isVisible ? "Ẩn" : "Hiện"}
            </button>
            <button
              onClick={() => handleDelete(row._id)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Xóa
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Quản lý đánh giá</h1>
        <p className="text-gray-600">
          Quản lý và kiểm duyệt đánh giá từ khách hàng
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm mb-1">Tổng đánh giá</div>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm mb-1">
              Đánh giá trung bình
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.averageRating}</span>
              <span className="text-yellow-400 text-xl">★</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 text-sm mb-2">Phân bố đánh giá</div>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-12">{star}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${
                          stats.totalReviews > 0
                            ? ((stats.ratingDistribution?.[star] || 0) /
                                stats.totalReviews) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right">
                    {stats.ratingDistribution?.[star] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Trạng thái</label>
            <select
              value={filter.isVisible}
              onChange={(e) =>
                setFilter({ ...filter, isVisible: e.target.value })
              }
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Tất cả</option>
              <option value="true">Hiển thị</option>
              <option value="false">Đã ẩn</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Đánh giá</label>
            <select
              value={filter.rating}
              onChange={(e) => setFilter({ ...filter, rating: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Tất cả</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilter({ isVisible: "", rating: "" })}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={columns}
          data={reviews}
          emptyMessage="Chưa có đánh giá nào"
        />
      </div>
    </div>
  );
}
