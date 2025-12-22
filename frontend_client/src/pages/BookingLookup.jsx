import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaDollarSign,
  FaCheckCircle,
  FaBed,
  FaUser,
} from "react-icons/fa";

export default function BookingLookup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bookingCode: "",
    phoneNumber: "",
  });
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setBooking(null);

    if (!formData.bookingCode.trim() || !formData.phoneNumber.trim()) {
      setError("Vui lòng nhập đầy đủ mã đặt phòng và số điện thoại");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/booking/lookup?bookingCode=${formData.bookingCode}&phoneNumber=${formData.phoneNumber}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Không tìm thấy đặt phòng với thông tin đã nhập");
        } else {
          setError("Có lỗi xảy ra, vui lòng thử lại sau");
        }
        return;
      }

      const data = await response.json();
      setBooking(data);
      const paymentResponse = await fetch(`/api/payment/booking/${data._id}`);
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setBooking((prev) => ({
          ...prev,
          paymentInfo: paymentData,
        }));
      }

      // Check if review exists
      if (data.status === "completed") {
        try {
          const reviewResponse = await fetch(
            `/api/reviews/booking/${data._id}`
          );
          if (reviewResponse.ok) {
            const reviewData = await reviewResponse.json();
            if (reviewData.success && reviewData.review) {
              setExistingReview(reviewData.review);
            }
          }
        } catch (err) {
          console.error("Error checking review:", err);
        }
      }

      console.log(booking);
    } catch (err) {
      console.error("Error looking up booking:", err);
      setError("Có lỗi xảy ra khi tra cứu đặt phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      const response = await fetch(
        `/api/booking/cancel-request/${booking._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to request cancellation");
      }

      const updatedBooking = await response.json();
      setBooking(updatedBooking);
      setShowCancelModal(false);
      alert(
        "Yêu cầu hủy đặt phòng đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất."
      );
    } catch (err) {
      console.error("Error requesting cancellation:", err);
      alert("Có lỗi xảy ra khi gửi yêu cầu hủy");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    // Chuyển sang giờ Việt Nam (UTC+7)
    return date.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getCheckInDate = (room) => {
    // Ưu tiên dùng actualCheckInDate nếu có, nếu không dùng expected
    return room.actualCheckInDate || room.expectedCheckInDate;
  };

  const getCheckOutDate = (room) => {
    // Ưu tiên dùng actualCheckOutDate nếu có, nếu không dùng expected
    return room.actualCheckOutDate || room.expectedCheckOutDate;
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Chờ xử lý",
      booked: "Đã đặt",
      checked_in: "Đã nhận phòng",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      booked: "bg-blue-100 text-blue-800",
      checked_in: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusText = (status) => {
    const statusMap = {
      paid: "Đã thanh toán",
      unpaid: "Chưa thanh toán",
      partially_paid: "Thanh toán một phần",
      refunded: "Đã hoàn tiền",
    };
    return statusMap[status] || status;
  };

  const calculateNights = (checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Hàm tính tổng đã thanh toán từ paymentInfo
  const calculateTotalPaid = () => {
    if (!booking.paymentInfo || !Array.isArray(booking.paymentInfo)) return 0;
    return booking.paymentInfo
      .filter((payment) => payment.status === "paid")
      .reduce((total, payment) => total + (payment.amount || 0), 0);
  };

  const getMergedServices = () => {
    if (!booking) return [];

    const mergedServices = {};

    // 1. Xử lý services từ booking (dịch vụ chung cho toàn bộ booking)
    if (booking.services && Array.isArray(booking.services)) {
      booking.services.forEach((service) => {
        const serviceId = service.serviceId?._id;
        if (serviceId) {
          if (!mergedServices[serviceId]) {
            mergedServices[serviceId] = {
              ...service,
              fromBooking: true,
              fromRooms: [],
            };
          } else {
            mergedServices[serviceId].quantity += service.quantity;
          }
        }
      });
    }

    // 2. Xử lý additionalServices từ các phòng
    if (booking.rooms && Array.isArray(booking.rooms)) {
      booking.rooms.forEach((room) => {
        if (room.additionalServices && Array.isArray(room.additionalServices)) {
          room.additionalServices.forEach((service) => {
            const serviceId = service.serviceId?._id;
            if (serviceId) {
              if (!mergedServices[serviceId]) {
                mergedServices[serviceId] = {
                  ...service,
                  fromBooking: false,
                  fromRooms: [room.roomSnapshot?.roomNumber],
                };
              } else {
                mergedServices[serviceId].quantity += service.quantity;
                // Thêm room number vào danh sách nếu chưa có
                if (
                  !mergedServices[serviceId].fromRooms.includes(
                    room.roomSnapshot?.roomNumber
                  )
                ) {
                  mergedServices[serviceId].fromRooms.push(
                    room.roomSnapshot?.roomNumber
                  );
                }
              }
            }
          });
        }
      });
    }

    // Chuyển object thành array và tính thành tiền
    return Object.values(mergedServices).map((service) => ({
      ...service,
      total:
        service.quantity * (service.price || service.serviceId?.price || 0),
    }));
  };

  const maskedInfo = (info) => {
    if (!info || info.length < 4) return "****";
    return "********" + info.slice(-4);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tra cứu thông tin đặt phòng
          </h1>
          <p className="text-gray-600">
            Nhập mã đặt phòng và số điện thoại để tra cứu thông tin
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-xl p-6 mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Tra cứu thông tin đặt phòng
              </h1>
              <p className="text-blue-100">
                Nhập mã đặt phòng và số điện thoại để tra cứu thông tin
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    <FaBed className="inline mr-2" />
                    Mã đặt phòng
                  </label>
                  <input
                    type="text"
                    name="bookingCode"
                    value={formData.bookingCode}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: BK0125001"
                    className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-transparent rounded-lg focus:border-white focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    <FaUser className="inline mr-2" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-transparent rounded-lg focus:border-white focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-blue-600 hover:bg-blue-50 py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
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
                    Đang tra cứu...
                  </span>
                ) : (
                  "🔍 Tra cứu"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Booking Details */}
        {booking && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            {/* Header card với gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Mã đặt phòng:{" "}
                    <span className="text-yellow-300">
                      {booking.bookingCode}
                    </span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusText(booking.status)}
                    </span>
                    <span className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-400 to-green-500 text-white">
                      {getPaymentStatusText(booking.paymentStatus)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <div className="text-blue-100 text-sm">Ngày đặt</div>
                  <div className="text-white font-bold text-lg">
                    {formatDate(booking.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Nội dung card */}
            <div className="p-6 space-y-8">
              {/* Customer Information */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaUser className="mr-2 text-blue-600" />
                  Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      label: "Họ và tên",
                      value: `${booking.customerSnapshot?.honorific} ${booking.customerSnapshot?.firstName} ${booking.customerSnapshot?.lastName}`,
                    },
                    {
                      label: "Email",
                      value: booking.customerSnapshot?.email || "N/A",
                    },
                    {
                      label: "Số điện thoại",
                      value: booking.customerSnapshot?.phoneNumber,
                    },
                    {
                      label: "CMND/CCCD",
                      value:
                        maskedInfo(
                          booking.customerSnapshot?.identificationNumber
                        ) || "N/A",
                    },
                  ].map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="text-sm text-gray-500 font-medium">
                        {item.label}
                      </div>
                      <div className="text-gray-800 font-semibold text-lg">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Information Table*/}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaBed className="mr-2 text-blue-600" />
                  Thông tin phòng
                </h3>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                      <tr>
                        {[
                          { text: "Thông tin phòng", icon: <FaBed /> },
                          { text: "Ngày nhận phòng", icon: <FaCalendarAlt /> },
                          { text: "Ngày trả phòng", icon: <FaCalendarAlt /> },
                          { text: "Số đêm", icon: null },
                          { text: "Thành tiền", icon: <FaDollarSign /> },
                        ].map((header, index) => (
                          <th key={index} className="px-6 py-4 text-left">
                            <div className="flex items-center space-x-2">
                              {header.icon}
                              <span className="text-sm font-semibold text-gray-700 uppercase">
                                {header.text}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {booking.rooms &&
                        booking.rooms.map((room, index) => {
                          const checkInDate = getCheckInDate(room);
                          const checkOutDate = getCheckOutDate(room);
                          const nights = calculateNights(
                            checkInDate,
                            checkOutDate
                          );

                          const roomTotal = room.pricePerNight * nights;

                          return (
                            <tr
                              key={index}
                              className="hover:bg-blue-50 transition-colors duration-150"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <p className="font-bold text-gray-900">
                                      Phòng{" "}
                                      {room.roomSnapshot?.roomNumber ||
                                        "Chưa phân phòng"}
                                    </p>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-gray-600">
                                      {room.roomSnapshot?.typeName || "N/A"}
                                    </p>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <span>
                                        {room.numberOfAdults} người lớn
                                      </span>
                                      {room.numberOfChildren > 0 && (
                                        <span>
                                          {room.numberOfChildren} trẻ em
                                        </span>
                                      )}
                                      {room.extraBedAdded && (
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                          Có giường phụ
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">
                                  {formatDate(checkInDate)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">
                                  {formatDate(checkOutDate)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-center">
                                  <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-800 rounded-full font-bold text-lg">
                                    {nights}
                                  </span>
                                  <div className="text-sm text-gray-500 mt-1">
                                    đêm
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-right">
                                  <div className="font-bold text-lg text-blue-600">
                                    {formatCurrency(roomTotal)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatCurrency(room.pricePerNight)}/đêm
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {booking.rooms && booking.rooms.length > 0 && (
                        <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
                          <td colSpan="4" className="px-6 py-4 text-right">
                            <span className="font-bold text-gray-900">
                              Tổng tiền phòng:
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-right">
                              <div className="font-bold text-xl text-blue-700">
                                {formatCurrency(
                                  booking.rooms.reduce((sum, room) => {
                                    const nights = calculateNights(
                                      room.actualCheckInDate,
                                      room.actualCheckOutDate
                                    );
                                    return sum + room.pricePerNight * nights;
                                  }, 0)
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {getMergedServices().length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaDollarSign className="mr-2 text-purple-600" />
                    Dịch vụ đã đặt
                  </h3>

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                            Tên dịch vụ
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                            Giá
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                            Số lượng
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {getMergedServices().map((service, index) => (
                          <tr
                            key={service.serviceId?._id || index}
                            className="hover:bg-purple-50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-gray-900">
                                  {service.serviceId?.name ||
                                    "Dịch vụ không xác định"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {service.fromBooking ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      📦 Toàn bộ booking
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                      🏨 Phòng: {service.fromRooms?.join(", ")}
                                    </span>
                                  )}
                                  {service.serviceId?.unitDisplay && (
                                    <span className="text-sm text-gray-500">
                                      ({service.serviceId.unitDisplay})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">
                                {formatCurrency(
                                  service.price || service.serviceId?.price || 0
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-center">
                                <span className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-800 rounded-full font-bold text-lg">
                                  {service.quantity}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-right">
                                <div className="font-bold text-lg text-purple-600">
                                  {formatCurrency(service.total)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {/* Tổng dịch vụ */}
                        {getMergedServices().length > 0 && (
                          <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <td colSpan="3" className="px-6 py-4 text-right">
                              <span className="font-bold text-gray-900">
                                Tổng tiền dịch vụ:
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-right">
                                <div className="font-bold text-xl text-gray-900">
                                  {formatCurrency(
                                    getMergedServices().reduce(
                                      (sum, service) => sum + service.total,
                                      0
                                    )
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaDollarSign className="mr-2 text-green-600" />
                  Tổng thanh toán
                </h3>

                <div className="space-y-4">
                  {/* Tổng tiền */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600 font-medium">
                          Tổng tiền
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-900">
                          {formatCurrency(booking.totalPrice)}
                        </div>
                      </div>
                      <FaDollarSign className="text-4xl text-green-500 opacity-50" />
                    </div>
                  </div>

                  {/* Đã thanh toán */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600 font-medium">
                          Đã thanh toán
                        </div>
                        <div className="text-xl font-bold text-green-700">
                          {formatCurrency(calculateTotalPaid())}
                        </div>
                      </div>
                      <FaCheckCircle className="text-2xl text-green-500" />
                    </div>
                  </div>

                  {/* Còn lại nếu có */}
                  {calculateTotalPaid() < booking.totalPrice && (
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-600 font-medium">
                            Còn lại
                          </div>
                          <div className="text-xl font-bold text-yellow-700">
                            {formatCurrency(
                              booking.totalPrice - calculateTotalPaid()
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons với design mới */}
              <div className="space-y-3">
                {booking.status === "completed" && !existingReview && (
                  <button
                    onClick={() => navigate(`/review/${booking._id}`)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    ⭐ Đánh giá trải nghiệm
                  </button>
                )}

                {booking.status === "completed" && existingReview && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-green-800 font-semibold">
                          ✓ Đã đánh giá
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          Cảm ơn bạn đã chia sẻ trải nghiệm!
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xl ${
                              star <= existingReview.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {booking.status === "booked" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    ❌ Yêu cầu hủy đặt phòng
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Xác nhận yêu cầu hủy
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn yêu cầu hủy đặt phòng này? Chúng tôi sẽ
                xem xét và liên hệ lại với bạn sớm nhất có thể.
              </p>
              <textarea
                type="text"
                className="w-full border border-gray-500 rounded-md p-2 mb-4"
                placeholder="Lý do hủy"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCancelRequest}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
