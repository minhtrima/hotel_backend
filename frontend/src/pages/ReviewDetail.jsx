import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackArrow from "../components/BackArrow";

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
          className={`text-3xl ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
      <span className="ml-3 text-xl font-medium">({rating}/5)</span>
    </div>
  );
};

export default function ReviewDetail() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview();
  }, [reviewId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/${reviewId}`);
      const data = await response.json();

      if (data.success) {
        setReview(data.review);
      } else {
        alert("Không tìm thấy đánh giá");
        navigate("/review");
      }
    } catch (error) {
      console.error("Error fetching review:", error);
      alert("Có lỗi xảy ra khi tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/toggle`, {
        method: "PUT",
      });
      const data = await response.json();

      if (data.success) {
        setReview(data.review);
        alert(data.message);
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert("Xóa đánh giá thành công");
        navigate("/review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Có lỗi xảy ra khi xóa đánh giá");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Không tìm thấy đánh giá</div>
      </div>
    );
  }

  return (
    <>
      <BackArrow to="/review" text="Danh sách đánh giá" />
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b">
            <div>
              <h1 className="text-2xl font-bold mb-2">Chi tiết đánh giá</h1>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  review.isVisible
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {review.isVisible ? "Đang hiển thị" : "Đã ẩn"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleVisibility}
                className={`px-4 py-2 rounded text-white ${
                  review.isVisible
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {review.isVisible ? "Ẩn đánh giá" : "Hiện đánh giá"}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Thông tin khách hàng</h2>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div>
                <span className="text-gray-600">Họ tên:</span>
                <span className="ml-2 font-medium">
                  {review.customerSnapshot?.honorific}{" "}
                  {review.customerSnapshot?.lastName}{" "}
                  {review.customerSnapshot?.firstName}
                </span>
              </div>
              {review.customerId?.email && (
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">
                    {review.customerId.email}
                  </span>
                </div>
              )}
              {review.customerId?.phoneNumber && (
                <div>
                  <span className="text-gray-600">Số điện thoại:</span>
                  <span className="ml-2 font-medium">
                    {review.customerId.phoneNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Info */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Thông tin đặt phòng</h2>
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-gray-600">Mã đặt phòng:</span>
                  <span className="ml-2 font-medium">
                    {review.bookingSnapshot?.bookingCode || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="ml-2 font-medium">
                    {review.bookingId?.status || "N/A"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-gray-600">Ngày nhận phòng:</span>
                  <span className="ml-2 font-medium">
                    {review.bookingSnapshot?.checkInDate
                      ? formatDate(review.bookingSnapshot.checkInDate)
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Ngày trả phòng:</span>
                  <span className="ml-2 font-medium">
                    {review.bookingSnapshot?.checkOutDate
                      ? formatDate(review.bookingSnapshot.checkOutDate)
                      : "N/A"}
                  </span>
                </div>
              </div>
              {review.bookingSnapshot?.roomTypes &&
                review.bookingSnapshot.roomTypes.length > 0 && (
                  <div>
                    <span className="text-gray-600">Loại phòng:</span>
                    <span className="ml-2 font-medium">
                      {review.bookingSnapshot.roomTypes.join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Đánh giá</h2>
            <div className="bg-yellow-50 p-4 rounded">
              <StarRating rating={review.rating} />
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Nhận xét</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {review.comment}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span>Ngày tạo:</span>
                <span className="ml-2 font-medium">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <div>
                <span>Cập nhật lần cuối:</span>
                <span className="ml-2 font-medium">
                  {formatDate(review.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
