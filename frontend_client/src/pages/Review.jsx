import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Review() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState({
    rating: 5,
    cleanliness: 5,
    service: 5,
    facilities: 5,
    valueForMoney: 5,
    comment: "",
  });

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await fetch(`/api/booking/${bookingId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch booking");
        }
        const data = await response.json();
        setBooking(data);
      } catch (error) {
        console.error("Error fetching booking:", error);
        alert("Không thể tải thông tin đặt phòng");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleRatingChange = (field, value) => {
    setReview((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingId,
          ...review,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      alert(
        "Cảm ơn bạn đã đánh giá! Ý kiến của bạn rất quan trọng với chúng tôi."
      );
      navigate("/");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= value ? "text-yellow-400" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-gray-600 self-center">{value}/5</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Đánh giá trải nghiệm của bạn
          </h1>
          <p className="text-gray-600 mb-6">
            Mã đặt phòng:{" "}
            <span className="font-medium">{booking?.bookingCode}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Đánh giá tổng quan
              </h2>
              <StarRating
                label="Đánh giá chung"
                value={review.rating}
                onChange={(value) => handleRatingChange("rating", value)}
              />
            </div>

            {/* Detailed Ratings */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Đánh giá chi tiết
              </h2>
              <div className="space-y-4">
                <StarRating
                  label="Sức sạch"
                  value={review.cleanliness}
                  onChange={(value) => handleRatingChange("cleanliness", value)}
                />
                <StarRating
                  label="Dịch vụ"
                  value={review.service}
                  onChange={(value) => handleRatingChange("service", value)}
                />
                <StarRating
                  label="Tiện nghi"
                  value={review.facilities}
                  onChange={(value) => handleRatingChange("facilities", value)}
                />
                <StarRating
                  label="Giá trị cho tiền"
                  value={review.valueForMoney}
                  onChange={(value) =>
                    handleRatingChange("valueForMoney", value)
                  }
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nhận xét của bạn
              </label>
              <textarea
                id="comment"
                rows={6}
                value={review.comment}
                onChange={(e) => handleRatingChange("comment", e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn tại khách sạn..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
