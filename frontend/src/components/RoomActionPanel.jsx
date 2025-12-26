import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBroom, FaCheckCircle, FaSprayCan, FaBan } from "react-icons/fa";

const fetchBookingData = async (roomid) => {
  const response = await fetch(`/api/booking/room/${roomid}`);
  if (!response.ok) throw new Error("Failed to fetch booking data");
  const data = await response.json();
  if (!data.success)
    throw new Error(data.message || "Failed to fetch booking data");
  return data.bookingId;
};

export default function RoomActionPanel({
  visible,
  onClose,
  room,
  onActionSuccess,
}) {
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!room) return;
    fetchBookingData(room._id)
      .then((bookingId) => {
        console.log(bookingId);
        setBookingId(bookingId);
      })
      .catch((error) => {
        console.error("Error fetching booking data:", error);
      });
  }, [room]);

  const handleCheckOut = async () => {
    try {
      console.log(room._id);
      const response = await fetch("/api/booking/checkout/" + bookingId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: [room._id] }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Checkout failed");
      }

      onActionSuccess();
      alert("Trả phòng thành công");
      onClose();
      navigate(`/booking/${data.bookingId}/payment`);
    } catch (error) {
      alert("Lỗi khi trả phòng: " + error.message);
    }
  };

  const handleRoomChange = async () => {
    try {
      if (!bookingId) {
        alert("Không tìm thấy thông tin booking");
        return;
      }

      onClose();
      navigate(`/booking/${bookingId}/change-room`);
    } catch (error) {
      alert("Lỗi khi đổi phòng: " + error.message);
    }
  };

  const handleHousekeepingStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`/api/room/${room._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ housekeepingStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update housekeeping status");
      }

      alert("Cập nhật trạng thái dọn phòng thành công");
      onActionSuccess();
      onClose();
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái dọn phòng: " + error.message);
    }
  };

  const handleToggleDND = async () => {
    try {
      const newDNDStatus = !room.doNotDisturb;
      const response = await fetch(`/api/room/${room._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doNotDisturb: newDNDStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update DND status");
      }

      alert(
        `${newDNDStatus ? "Bật" : "Tắt"} chế độ không làm phiền thành công`
      );
      onActionSuccess();
      onClose();
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái DND: " + error.message);
    }
  };

  return (
    <>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
          <div
            ref={panelRef}
            className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg p-6 relative pointer-events-auto"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">
                Quản lý phòng {room?.roomNumber || ""}
              </h2>
              <button
                onClick={onClose}
                className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Booking Actions */}
              {room?.status === "occupied" && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 border-b pb-2">
                    Thao tác đặt phòng
                  </h3>
                  <button
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    onClick={handleCheckOut}
                  >
                    <FaCheckCircle />
                    Trả phòng
                  </button>

                  <button
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition flex items-center justify-center gap-2"
                    onClick={handleRoomChange}
                  >
                    <FaBroom />
                    Đổi phòng
                  </button>
                </div>
              )}

              {/* Housekeeping Status Management */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 border-b pb-2">
                  Trạng thái dọn phòng
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-600 mb-2">
                    Hiện tại:{" "}
                    <span className="font-semibold">
                      {room?.housekeepingStatus === "clean" && "Sạch sẽ"}
                      {room?.housekeepingStatus === "dirty" && "Cần dọn"}
                      {room?.housekeepingStatus === "cleaning" && "Đang dọn"}
                      {!room?.housekeepingStatus && "Không xác định"}
                    </span>
                  </div>
                  <button
                    className={`w-full py-2 rounded transition flex items-center justify-center gap-2 ${
                      room?.housekeepingStatus === "clean"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-green-500 hover:text-white"
                    }`}
                    onClick={() => handleHousekeepingStatusChange("clean")}
                    disabled={room?.housekeepingStatus === "clean"}
                  >
                    <FaCheckCircle />
                    Sạch sẽ
                  </button>

                  <button
                    className={`w-full py-2 rounded transition flex items-center justify-center gap-2 ${
                      room?.housekeepingStatus === "dirty"
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white"
                    }`}
                    onClick={() => handleHousekeepingStatusChange("dirty")}
                    disabled={room?.housekeepingStatus === "dirty"}
                  >
                    <FaBroom />
                    Cần dọn
                  </button>

                  <button
                    className={`w-full py-2 rounded transition flex items-center justify-center gap-2 ${
                      room?.housekeepingStatus === "cleaning"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
                    }`}
                    onClick={() => handleHousekeepingStatusChange("cleaning")}
                    disabled={room?.housekeepingStatus === "cleaning"}
                  >
                    <FaSprayCan />
                    Đang dọn
                  </button>
                </div>
              </div>

              {/* Do Not Disturb Toggle */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 border-b pb-2">
                  Không làm phiền (DND)
                </h3>
                <button
                  className={`w-full py-3 rounded transition flex items-center justify-center gap-2 font-semibold ${
                    room?.doNotDisturb
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white"
                  }`}
                  onClick={handleToggleDND}
                >
                  <FaBan />
                  {room?.doNotDisturb ? "Tắt DND" : "Bật DND"}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  {room?.doNotDisturb
                    ? "Phòng đang ở chế độ không làm phiền"
                    : "Nhấn để bật chế độ không làm phiền"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
