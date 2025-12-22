import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";

export default function BookingComplete() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get payment result from navigation state if available
  const paymentResult = location.state?.paymentResult;

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await fetch(`/api/booking/${bookingId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch booking details");
        }
        const data = await response.json();
        if (data.success) {
          setBooking(data.booking);
        } else {
          throw new Error(data.message || "Failed to load booking");
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: { text: "Đã thanh toán", class: "bg-green-100 text-green-800" },
      partially_paid: {
        text: "Thanh toán một phần",
        class: "bg-yellow-100 text-yellow-800",
      },
      unpaid: { text: "Chưa thanh toán", class: "bg-red-100 text-red-800" },
    };

    const badge = badges[status] || badges.unpaid;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}
      >
        {badge.text}
      </span>
    );
  };

  const getBookingStatusBadge = (status) => {
    const badges = {
      booked: { text: "Đã đặt", class: "bg-blue-100 text-blue-800" },
      checked_in: {
        text: "Đã nhận phòng",
        class: "bg-green-100 text-green-800",
      },
      checked_out: { text: "Đã trả phòng", class: "bg-gray-100 text-gray-800" },
      completed: { text: "Hoàn thành", class: "bg-purple-100 text-purple-800" },
      cancelled: { text: "Đã hủy", class: "bg-red-100 text-red-800" },
    };

    const badge = badges[status] || badges.booked;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}
      >
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                Có lỗi xảy ra
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Không tìm thấy đặt phòng
              </h1>
              <button
                onClick={() => navigate("/")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                Đặt phòng thành công!
              </h1>
              <p className="text-gray-600 mb-4">
                Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi
              </p>
              {paymentResult?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-medium">
                    ✓ Thanh toán VNPay thành công:{" "}
                    {formatCurrency(paymentResult.payment?.amount || 0)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Chi tiết đặt phòng
            </h2>

            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  Thông tin đặt phòng
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-600">
                      Mã đặt phòng:
                    </span>
                    <span className="font-bold text-blue-600 ml-2">
                      {booking.bookingCode}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">
                      Trạng thái:
                    </span>
                    <span className="ml-2">
                      {getBookingStatusBadge(booking.status)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">
                      Thanh toán:
                    </span>
                    <span className="ml-2">
                      {getPaymentStatusBadge(booking.paymentStatus)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">
                      Tổng tiền:
                    </span>
                    <span className="font-bold text-lg text-red-600 ml-2">
                      {formatCurrency(booking.totalPrice)}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  Thông tin khách hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-600">Họ tên:</span>
                    <span className="ml-2">
                      {booking.customerid?.honorific || ""}
                    </span>{" "}
                    <span className="m">{booking.customerid?.lastName}</span>
                    <span className="ml-1">
                      {booking.customerid?.firstName}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="ml-2">{"abc@gmail.com"}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">
                      Điện thoại:
                    </span>
                    <span className="ml-2">
                      {booking.customerid?.phoneNumber}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Room Information */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Thông tin phòng
              </h3>
              <div className="space-y-4">
                {booking.rooms.map((room, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Phòng {room.roomSnapshot?.roomNumber} -{" "}
                          {room.roomSnapshot?.typeName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(room.pricePerNight)} / đêm
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          room.status === "checked_in"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {room.status === "checked_in"
                          ? "Đã nhận phòng"
                          : "Đã đặt"}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Nhận phòng:</span>{" "}
                          {formatDate(room.expectedCheckInDate)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Trả phòng:</span>{" "}
                          {formatDate(room.expectedCheckOutDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          <span className="font-medium">Khách chính:</span>{" "}
                          {room.mainGuest?.firstName} {room.mainGuest?.lastName}
                        </p>
                        {room.additionalGuests?.length > 0 && (
                          <p className="text-gray-600">
                            <span className="font-medium">Khách thêm:</span>{" "}
                            {room.additionalGuests.length} người
                          </p>
                        )}
                      </div>
                    </div>

                    {room.additionalServices?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="font-medium text-gray-800 mb-2">
                          Dịch vụ thêm:
                        </p>
                        <div className="space-y-1">
                          {room.additionalServices.map(
                            (service, serviceIndex) => (
                              <p
                                key={serviceIndex}
                                className="text-sm text-gray-600"
                              >
                                • {service.serviceId?.name || "Dịch vụ"} (x
                                {service.quantity}) -{" "}
                                {formatCurrency(service.price)}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Transportation Services */}
            {booking.services?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Dịch vụ vận chuyển
                </h3>
                <div className="space-y-2">
                  {booking.services.map((service, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-gray-800">
                        {service.serviceId?.name || "Dịch vụ vận chuyển"} (x
                        {service.quantity})
                      </span>
                      <span className="font-medium text-gray-800">
                        {formatCurrency(service.price * service.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Yêu cầu đặc biệt
                </h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                  {booking.specialRequests}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  ></path>
                </svg>
                In phiếu đặt phòng
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
              >
                Về trang chủ
              </button>
            </div>

            {/* Important Note */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.136 16.5c-.77.833.192 2.5 1.732 2.5z"
                  ></path>
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">
                    Lưu ý quan trọng:
                  </p>
                  <ul className="text-yellow-700 space-y-1">
                    <li>
                      • Vui lòng mang theo giấy tờ tùy thân khi nhận phòng
                    </li>
                    <li>• Check-in: 14:00 | Check-out: 12:00</li>
                    <li>
                      • Liên hệ khách sạn: (+84) 28 1234 5678 nếu cần hỗ trợ
                    </li>
                    {booking.paymentStatus !== "paid" && (
                      <li>• Vui lòng hoàn tất thanh toán khi nhận phòng</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
