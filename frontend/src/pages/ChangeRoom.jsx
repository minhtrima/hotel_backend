import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaBed, FaExchangeAlt, FaArrowLeft } from "react-icons/fa";
import LoadingPage from "../components/Loading";

export default function ChangeRoom() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedOldRoom, setSelectedOldRoom] = useState(null);
  const [selectedOldRoomData, setSelectedOldRoomData] = useState(null);
  const [selectedNewRoom, setSelectedNewRoom] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  // Fetch available rooms when old room is selected
  useEffect(() => {
    if (selectedOldRoomData) {
      fetchAvailableRooms(selectedOldRoomData.expectedCheckOutDate);
    } else {
      setAvailableRooms([]);
      setSelectedNewRoom(null);
    }
  }, [selectedOldRoomData]);

  const fetchBookingData = async () => {
    try {
      const response = await fetch(`/api/booking/${bookingId}`);
      if (!response.ok) throw new Error("Failed to fetch booking");
      const data = await response.json();
      if (data.success) {
        setBooking(data.booking);
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      alert("Lỗi khi tải thông tin booking");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async (checkOutDate) => {
    if (!checkOutDate) return;

    setLoadingRooms(true);
    try {
      const now = new Date().toISOString().split("T")[0];
      const checkOut = new Date(checkOutDate).toISOString().split("T")[0];

      const response = await fetch(
        `/api/room/available?checkInDate=${now}&checkOutDate=${checkOut}`
      );
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const data = await response.json();
      if (data.success) {
        // Filter rooms:
        // 1. Only show rooms with visibleStatus === "available"
        // 2. Exclude the current selected old room (by roomid)
        const filteredRooms = (data.rooms || []).filter((room) => {
          // Check visibleStatus or status
          const roomStatus = room.visibleStatus || room.status;
          if (roomStatus !== "available") {
            return false;
          }

          // Exclude the current old room by ID
          const roomId = room._id?.toString();
          if (selectedOldRoom && roomId === selectedOldRoom.toString()) {
            return false;
          }

          return true;
        });

        setAvailableRooms(filteredRooms);
      }
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      alert("Lỗi khi tải danh sách phòng trống");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSelectOldRoom = (roomId, roomData) => {
    setSelectedOldRoom(roomId);
    setSelectedOldRoomData(roomData);
    setSelectedNewRoom(null); // Reset selected new room
  };

  const handleChangeRoom = async () => {
    if (!selectedOldRoom || !selectedNewRoom) {
      alert("Vui lòng chọn phòng cũ và phòng mới");
      return;
    }

    if (selectedOldRoom === selectedNewRoom) {
      alert("Phòng mới phải khác phòng cũ");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/booking/change-room/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldRoomId: selectedOldRoom,
          newRoomId: selectedNewRoom,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Đổi phòng thất bại");
      }

      alert(
        `Đổi phòng thành công!\nTừ phòng ${data.oldRoomNumber} sang phòng ${data.newRoomNumber}`
      );
      navigate("/");
    } catch (error) {
      console.error("Error changing room:", error);
      alert("Lỗi khi đổi phòng: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  if (loading) return <LoadingPage />;

  if (!booking) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">
          Không tìm thấy thông tin booking
        </div>
      </div>
    );
  }

  // Lọc các phòng đang checked_in
  const checkedInRooms = booking.rooms.filter(
    (room) => room.status === "checked_in"
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Quay lại
        </button>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaExchangeAlt className="mr-3 text-blue-600" />
          Đổi phòng
        </h1>
        <p className="text-gray-600 mt-2">
          Booking: <span className="font-semibold">{booking.bookingCode}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chọn phòng cũ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FaBed className="mr-2 text-red-500" />
            Chọn phòng cần đổi
          </h2>

          {checkedInRooms.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Không có phòng nào đang ở (checked_in)
            </div>
          ) : (
            <div className="space-y-3">
              {checkedInRooms.map((room) => {
                const roomId =
                  typeof room.roomid === "object" && room.roomid !== null
                    ? room.roomid._id?.toString() || room.roomid.toString()
                    : room.roomid?.toString();

                return (
                  <div
                    key={roomId}
                    onClick={() => handleSelectOldRoom(roomId, room)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedOldRoom === roomId
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg">
                          Phòng {room.roomSnapshot?.roomNumber || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {room.desiredRoomTypeId?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {room.numberOfAdults} người lớn
                          {room.numberOfChildren > 0 &&
                            `, ${room.numberOfChildren} trẻ em`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-600 font-semibold">
                          {formatCurrency(room.pricePerNight)}
                        </div>
                        <div className="text-xs text-gray-500">/ đêm</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chọn phòng mới */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FaBed className="mr-2 text-green-500" />
            Chọn phòng mới
          </h2>

          {!selectedOldRoom ? (
            <div className="text-gray-500 text-center py-8">
              Vui lòng chọn phòng cần đổi trước
            </div>
          ) : loadingRooms ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Đang tải danh sách phòng...</p>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Không có phòng trống phù hợp
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {availableRooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => setSelectedNewRoom(room._id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedNewRoom === room._id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">
                        Phòng {room.roomNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {room.typeid?.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tầng {room.floor}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-semibold">
                        {formatCurrency(room.typeid?.pricePerNight || 0)}
                      </div>
                      <div className="text-xs text-gray-500">/ đêm</div>
                      <div className="mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            room.housekeepingStatus === "clean"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {room.housekeepingStatus === "clean"
                            ? "Sạch sẽ"
                            : "Chưa dọn"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleChangeRoom}
          disabled={
            !selectedOldRoom || !selectedNewRoom || processing || loading
          }
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {processing ? (
            <>
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
              Đang xử lý...
            </>
          ) : (
            <>
              <FaExchangeAlt className="mr-2" />
              Xác nhận đổi phòng
            </>
          )}
        </button>
      </div>

      {/* Thông tin */}
      {selectedOldRoom && selectedNewRoom && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-gray-700">
            <strong>Lưu ý:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Phòng cũ sẽ được check out tự động</li>
              <li>Phòng mới sẽ được check in ngay lập tức</li>
              <li>
                Thông tin khách và ngày check out dự kiến sẽ được giữ nguyên
              </li>
              <li>Tổng giá booking sẽ được tính lại</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
