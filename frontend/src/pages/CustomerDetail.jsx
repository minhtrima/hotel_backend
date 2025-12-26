import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerForm from "../components/CustomerForm";
import BackArrow from "../components/BackArrow";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
};

const BOOKING_STATUS_COLORS = {
  booked: "bg-yellow-100 text-yellow-800",
  checked_in: "bg-blue-100 text-blue-800",
};

const BOOKING_STATUS_LABELS = {
  booked: "Đã đặt phòng",
  checked_in: "Đã nhận phòng",
};

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomerBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/booking");
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const data = await response.json();

      // Filter bookings for this customer with status booked or checked_in
      const customerBookings = data.bookings.filter(
        (booking) =>
          booking.customerid?._id === customerId &&
          (booking.status === "booked" || booking.status === "checked_in")
      );

      setExistingBookings(customerBookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      setExistingBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowBookings = () => {
    fetchCustomerBookings();
    setShowBookingModal(true);
  };

  const handleCreateNewBooking = () => {
    setShowBookingModal(false);
    navigate(`/booking/add/`, { state: { customerId: customerId } });
  };

  return (
    <>
      <BackArrow to="/customer" />
      <div className="max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg mt-5">
        <h2 className="text-lg font-bold mb-6">Thông tin khách hàng</h2>
        <CustomerForm customerId={customerId} />
        <div className="mt-4">
          <button
            onClick={handleShowBookings}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            Tiến hành đặt phòng
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Đặt phòng cho khách hàng</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Existing Bookings Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Đặt phòng hiện có
                </h3>

                {loading ? (
                  <div className="text-center py-4">Đang tải...</div>
                ) : existingBookings.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {existingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">
                                Mã đặt phòng: {booking.bookingCode}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  BOOKING_STATUS_COLORS[booking.status] ||
                                  "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {BOOKING_STATUS_LABELS[booking.status] ||
                                  booking.status}
                              </span>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                              {booking.rooms && booking.rooms.length > 0 && (
                                <div>
                                  <p>
                                    Ngày nhận:{" "}
                                    {formatDate(
                                      booking.rooms[0].expectedCheckInDate
                                    )}
                                  </p>
                                  <p>
                                    Ngày trả:{" "}
                                    {formatDate(
                                      booking.rooms[0].expectedCheckOutDate
                                    )}
                                  </p>
                                  <p>Số phòng: {booking.rooms.length} phòng</p>
                                </div>
                              )}
                              {booking.totalPrice > 0 && (
                                <p className="font-medium text-green-600">
                                  Tổng tiền:{" "}
                                  {formatCurrency(booking.totalPrice)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="ml-4">
                            <button
                              onClick={() =>
                                navigate(`/booking/${booking._id}`)
                              }
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Khách hàng chưa có đặt phòng nào đang hoạt động.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="border-t pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateNewBooking}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                  >
                    Tạo đặt phòng mới
                  </button>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
