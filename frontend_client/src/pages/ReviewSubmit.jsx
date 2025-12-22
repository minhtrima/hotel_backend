import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ReviewSubmit() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/booking/${bookingId}`);
      const data = await response.json();

      if (data.success) {
        // Check if booking is completed
        if (data.booking.status !== "completed") {
          setError("Chỉ có thể đánh giá sau khi hoàn tất đặt phòng");
          return;
        }

        setBooking(data.booking);

        // Check if already reviewed
        const reviewResponse = await fetch(`/api/reviews/booking/${bookingId}`);
        const reviewData = await reviewResponse.json();
        if (reviewData.success && reviewData.review) {
          setError("Đặt phòng này đã được đánh giá");
          setTimeout(() => navigate("/"), 2000);
        }
      } else {
        setError("Không tìm thấy đặt phòng");
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Có lỗi xảy ra khi tải thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!comment.trim()) {
      alert("Vui lòng nhập nhận xét của bạn");
      return;
    }

    if (comment.trim().length < 10) {
      alert("Nhận xét phải có ít nhất 10 ký tự");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          customerId: booking.customerid._id || booking.customerid,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          "Cảm ơn bạn đã đánh giá! Đánh giá của bạn rất quan trọng với chúng tôi."
        );
        navigate("/");
      } else {
        alert(data.message || "Có lỗi xảy ra khi gửi đánh giá");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Không thể đánh giá
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Quay lại trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Đánh giá trải nghiệm
          </h1>
          <p className="text-gray-600">
            Chia sẻ trải nghiệm của bạn để giúp chúng tôi phục vụ tốt hơn
          </p>
        </div>

        {/* Booking Info Card */}
        {booking && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông tin đặt phòng
              </h3>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Đã hoàn thành
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mã đặt phòng:</span>
                <span className="ml-2 font-medium">{booking.bookingCode}</span>
              </div>
              <div>
                <span className="text-gray-600">Số phòng:</span>
                <span className="ml-2 font-medium">
                  {booking.rooms?.length || 0} phòng
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* Rating Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4 text-center">
              Bạn đánh giá thế nào về trải nghiệm tại khách sạn?
            </label>
            <div className="flex justify-center items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transform transition-transform hover:scale-110"
                >
                  <span
                    className={`text-6xl ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    } transition-colors`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            <div className="text-center">
              {rating > 0 && (
                <p className="text-gray-600 font-medium">
                  {rating === 5 && "Xuất sắc! 🎉"}
                  {rating === 4 && "Rất tốt! 😊"}
                  {rating === 3 && "Tốt 👍"}
                  {rating === 2 && "Cần cải thiện 🤔"}
                  {rating === 1 && "Chưa tốt 😞"}
                </p>
              )}
            </div>
          </div>

          {/* Comment Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              Nhận xét của bạn
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Chia sẻ chi tiết về trải nghiệm của bạn (tối thiểu 10 ký tự)
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hãy cho chúng tôi biết điều bạn thích hoặc những điểm cần cải thiện..."
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">{comment.length} ký tự</p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={
                submitting || rating === 0 || comment.trim().length < 10
              }
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 hover:shadow-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                "Gửi đánh giá"
              )}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Đánh giá của bạn sẽ được xem xét và có thể
            được hiển thị công khai để giúp khách hàng khác có thêm thông tin
            khi đặt phòng.
          </p>
        </div>
      </div>
    </div>
  );
}
