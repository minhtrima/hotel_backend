import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmModal from "./ConfirmModal";

const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = start.getDate().toString().padStart(2, "0");
  const startMonth = (start.getMonth() + 1).toString().padStart(2, "0");
  const endDay = end.getDate().toString().padStart(2, "0");
  const endMonth = (end.getMonth() + 1).toString().padStart(2, "0");
  const year = end.getFullYear();

  return `${startDay} THÁNG ${startMonth} - ${endDay} THÁNG ${endMonth}, ${year}`;
};

export default function BookingSidebar({ booking, onDeleteRoom }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isBookingRoomPage = location.pathname.includes("booking-room");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDateConfirmModal, setShowDateConfirmModal] = useState(false);

  const handleResetRoomClick = () => {
    setShowConfirmModal(true);
  };

  const handleResetDateClick = () => {
    setShowDateConfirmModal(true);
  };

  if (!booking) return null;

  const resetRoom = async () => {
    try {
      console.log("reset room");
      setShowConfirmModal(false);
      const response = await fetch(`/api/booking/reset-room/${booking._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reset room");
      }

      const data = await response.json();
      if (data.success) {
        // Navigate to booking-room page after successful reset
        navigate(`/booking-room/${booking._id}`);
      }
    } catch (error) {
      console.error("Error resetting room:", error);
      alert("Lỗi khi reset phòng: " + error.message);
    }
  };

  const resetDate = async () => {
    try {
      console.log("reset date");
      setShowDateConfirmModal(false);
      const response = await fetch(`/api/booking/reset-date/${booking._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to reset dates");
      }
      const data = await response.json();
      if (data.success) {
        // Force page refresh to ensure all data is updated
        window.location.href = `/booking/${booking._id}`;
      }
    } catch (error) {
      console.error("Error resetting dates:", error);
      alert("Lỗi khi reset ngày: " + error.message);
    }
  };

  const getTotalServicePrice = () => {
    if (!booking || !booking.rooms) return 0;

    return booking.rooms.reduce((total, room) => {
      const roomServicePrice = room.additionalServices.reduce(
        (serviceTotal, service) => serviceTotal + (service.price || 0),
        0
      );
      return total + roomServicePrice;
    }, 0);
  };

  console.log("BookingSidebar booking:", booking);

  const totalNights =
    booking.expectedCheckInDate && booking.expectedCheckOutDate
      ? Math.ceil(
          (new Date(booking.expectedCheckOutDate) -
            new Date(booking.expectedCheckInDate)) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const getTotalRoomPrice = () => {
    if (!booking || !booking.rooms) return 0;

    return booking.rooms.reduce((total, room) => {
      const basePrice = room.desiredRoomTypeId?.pricePerNight || 0;
      const capacity = room.desiredRoomTypeId?.capacity || 0;
      const extraBedPrice = room.desiredRoomTypeId?.extraBedPrice || 0;
      const extraBedAllowed = room.desiredRoomTypeId?.extraBedAllowed || false;
      const requiredAdults = room.numberOfAdults || 0;

      const roomPricePerNight =
        requiredAdults > capacity && extraBedAllowed
          ? basePrice + extraBedPrice
          : basePrice;

      return total + roomPricePerNight * totalNights;
    }, 0);
  };

  const getRoomTotalPrice = () => {
    if (!booking || !booking.rooms) return 0;
    const totalRoomsPrice = booking.rooms.reduce(
      (total, room) => total + (room.pricePerNight || 0),
      0
    );
    const totalServicesPrice = booking.services.reduce(
      (total, service) =>
        total + (service.price || 0) * (service.quantity || 1),
      0
    );
    return totalRoomsPrice * totalNights + totalServicesPrice;
  };

  return (
    <div className="bg-gray-800 text-white p-6 w-80 min-h-screen">
      <h2 className="text-2xl font-bold mb-8 text-center">
        Thông tin
        <br />
        Booking
      </h2>

      <div className="space-y-6">
        {/* Hotel Name */}
        <div className="border-b border-gray-600 pb-4">
          <h3 className="text-lg font-semibold tracking-wide">HẢI ÂU HOTEL</h3>
        </div>

        {/* Date Range */}
        {booking.expectedCheckInDate && booking.expectedCheckOutDate && (
          <div className="border-b border-gray-600 pb-4">
            <p className="text font-semibold tracking-wide">
              {formatDateRange(
                booking.expectedCheckInDate,
                booking.expectedCheckOutDate
              )}
            </p>
            <p className="text-end">
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 text-sm  cursor-pointer transition-colors duration-200"
                onClick={handleResetDateClick}
              >
                Chọn lại ngày
              </button>
            </p>
          </div>
        )}

        {/* Number of Rooms */}
        {booking.rooms && booking.rooms.length > 0 && (
          <div className="border-b border-gray-600 pb-4">
            <div className="flex justify-between items-center">
              <p className="text font-semibold tracking-wide">
                {booking.rooms.length} PHÒNG
              </p>
              {!isBookingRoomPage && (
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer transition-colors duration-200"
                  onClick={handleResetRoomClick}
                >
                  Chọn lại phòng
                </button>
              )}
            </div>
          </div>
        )}
        {/* Room Info */}

        {booking.rooms && booking.rooms.length > 0 && (
          <div className="border-gray-600 ">
            {booking.rooms.map((room, index) => (
              <div key={index} className="mb-2 border-b border-gray-600 pb-2">
                <div className="flex justify-between">
                  <p className="text font-semibold tracking-wide">
                    Phòng {index + 1}{" "}
                  </p>

                  {isBookingRoomPage && room.desiredRoomTypeId && (
                    <button
                      type="button"
                      className="text-red-500 hover:underline cursor-pointer"
                      onClick={() => onDeleteRoom(index)}
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <p className="text font-semibold tracking-wide">
                  {room.desiredRoomTypeId?.name || "Chọn phòng"}
                </p>
                {room.desiredRoomTypeId && (
                  <div>
                    <p>
                      Giá:{" "}
                      <span className="text-green-500">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          currencyDisplay: "code",
                        }).format(
                          (() => {
                            const basePrice =
                              room.desiredRoomTypeId?.pricePerNight || 0;
                            const capacity =
                              room.desiredRoomTypeId?.capacity || 0;
                            const extraBedPrice =
                              room.desiredRoomTypeId?.extraBedPrice || 0;
                            const extraBedAllowed =
                              room.desiredRoomTypeId?.extraBedAllowed || false;
                            const requiredAdults = room.numberOfAdults || 0;

                            const roomPricePerNight =
                              requiredAdults > capacity && extraBedAllowed
                                ? basePrice + extraBedPrice
                                : basePrice;

                            return roomPricePerNight * totalNights;
                          })()
                        )}
                      </span>
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-400">
                  Người lớn: {room.numberOfAdults || 0}, Trẻ em:{" "}
                  {room.numberOfChildren || 0}
                </p>
              </div>
            ))}
            {booking.rooms.every((room) => room.desiredRoomTypeId) && (
              <div className="border-gray-50 ">
                <p className="text font-semibold tracking-wide text-xl">
                  Tổng tiền phòng
                </p>
                <div className="text-end text-green-500 font-semibold text-lg">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    currencyDisplay: "code",
                  }).format(getTotalRoomPrice())}
                  /{totalNights} đêm
                </div>
              </div>
            )}
          </div>
        )}
        {/* Services */}
        {booking.rooms &&
          booking.rooms.length > 0 &&
          booking.rooms.every((room) => room.desiredRoomTypeId) &&
          booking.rooms.some((room) => room.additionalServices.length > 0) && (
            <div className="border-b border-gray-600 pb-4">
              <h3 className="text-lg font-semibold tracking-wide">Dịch vụ</h3>
              {booking.rooms.map((room, index) => (
                <div className="mt-2" key={index}>
                  <p className="text font-semibold tracking-wide">
                    Phòng {index + 1}{" "}
                  </p>
                  {room.additionalServices.map((service, idx) => (
                    <p key={idx} className="text-sm ps-4 text-gray-200">
                      {service.serviceId?.name || "Dịch vụ không xác định"}
                      {` (SL: ${service.quantity || 1})`} -{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        currencyDisplay: "code",
                      }).format(service.price || 0)}
                    </p>
                  ))}
                </div>
              ))}
              {/* Total Service Price */}
              <div className="mt-4 pt-4 border-t border-gray-500">
                <div className="flex justify-between items-center">
                  <span className="text font-semibold tracking-wide">
                    Tổng tiền dịch vụ:
                  </span>
                  <span className="text-lg text-green-500 font-semibold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      currencyDisplay: "code",
                    }).format(getTotalServicePrice())}
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* Transportation Services */}
        {booking.services && booking.services.length > 0 && (
          <div className="border-b border-gray-600 pb-4">
            <h3 className="text-lg font-semibold tracking-wide">Dịch vụ</h3>
            {booking.services.map((service, index) => (
              <div key={index}>
                <p className="text-sm ps-4 text-gray-200 mt-2">
                  {service.serviceId?.name || "Dịch vụ không xác định"}
                  {` (SL: ${service.quantity || 1})`}
                </p>
                <p className="text-sm ps-4 text-green-500 mb-2 text-end ">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    currencyDisplay: "code",
                  }).format((service.price || 0) * (service.quantity || 1))}
                </p>
              </div>
            ))}
            {/* Total Transportation Service Price */}
            <div className="mt-4 pt-4 border-t border-gray-500">
              <p className="text font-semibold tracking-wide">
                Tổng tiền dịch vụ:
              </p>
              <p className="text-lg text-green-500 font-semibold text-end">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  currencyDisplay: "code",
                }).format(
                  (booking.services || []).reduce(
                    (sum, service) =>
                      sum + (service.price || 0) * (service.quantity || 1),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        )}

        {/* Total Price */}
        {booking.rooms &&
          booking.rooms.length > 0 &&
          booking.rooms.every((room) => room.desiredRoomTypeId) &&
          booking.rooms.some((room) => room.desiredRoomTypeId) && (
            <div className="border-b border-gray-600 pb-4">
              <h3 className="text-lg font-semibold tracking-wide">Tổng tiền</h3>
              <p className="text-2xl text-green-500 font-semibold tracking-wide text-end">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  currencyDisplay: "code",
                }).format(getRoomTotalPrice() || 0)}
              </p>
            </div>
          )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        message="Bạn có chắc chắn muốn chọn lại phòng? Tất cả lựa chọn phòng hiện tại sẽ bị xóa."
        onConfirm={resetRoom}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ConfirmModal
        isOpen={showDateConfirmModal}
        message="Bạn có chắc chắn muốn chọn lại ngày? Tất cả thông tin đặt phòng hiện tại sẽ bị xóa."
        onConfirm={resetDate}
        onCancel={() => setShowDateConfirmModal(false)}
      />
    </div>
  );
}
