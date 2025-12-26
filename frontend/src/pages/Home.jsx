import React, { useEffect, useState } from "react";
import { BsPersonFillAdd, BsPersonFillGear } from "react-icons/bs";
import { FaGear } from "react-icons/fa6";
import LoadingPage from "../components/Loading";
import CreateFullBookingForm from "../components/CreateFullBookingForm";
import RoomActionPanel from "../components/RoomActionPanel";
import NotificationModal from "../components/NotificationModal";

const fetchAvailableRooms = (checkInDate, checkOutDate) => {
  return fetch(
    `/api/room/available?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&client=true`
  )
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch available rooms");
      return response.json();
    })
    .then((data) => {
      console.log("API response:", data);
      if (data.success) {
        // Handle different response formats
        if (data.rooms) {
          return data.rooms;
        } else if (data.roomsByType) {
          // Flatten roomsByType object into a single array
          const allRooms = [];
          Object.values(data.roomsByType).forEach((typeRooms) => {
            allRooms.push(...typeRooms);
          });
          return allRooms;
        }
        return [];
      }
      throw new Error("Failed to fetch available rooms");
    });
};

const getStatusColor = (room) => {
  // Use visibleStatus for display colors (based on selected date range)
  const displayStatus = room.visibleStatus || room.status;

  if (room.doNotDisturb) return "bg-purple-500";
  if (displayStatus === "occupied") return "bg-red-500";
  if (room.housekeepingStatus !== "clean") return "bg-blue-500";
  if (displayStatus === "booked") return "bg-yellow-500";
  if (displayStatus === "available") return "bg-green-500";
  if (displayStatus === "maintenance") return "bg-gray-500";

  return "bg-white";
};

export default function BookingPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [actionRoom, setActionRoom] = useState(null);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
  });

  // Default: today for check-in, +3 days for check-out
  const today = new Date();
  const dayLater = new Date(today);
  dayLater.setDate(today.getDate() + 1);

  const formatDate = (date) => date.toISOString().slice(0, 10);

  const [checkInDate, setCheckInDate] = useState(formatDate(today));
  const [checkOutDate, setCheckOutDate] = useState(formatDate(dayLater));

  // Fetch available rooms on mount and when dates change (on submit)
  useEffect(() => {
    setLoading(true);
    fetchAvailableRooms(checkInDate, checkOutDate)
      .then(setRooms)
      .catch((err) => console.error("Failed to load rooms:", err))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []); // Only run on mount

  const handleDateSubmit = () => {
    setLoading(true);
    fetchAvailableRooms(checkInDate, checkOutDate)
      .then(setRooms)
      .catch((err) => console.error("Failed to load rooms:", err))
      .finally(() => setLoading(false));
  };

  const fetchRoomDataAndUpdate = async () => {
    setLoading(true);
    try {
      const data = await fetchAvailableRooms(checkInDate, checkOutDate);
      setRooms(data);
    } catch (err) {
      console.error("Failed to reload rooms:", err);
    } finally {
      setLoading(false);
      setShowBookingForm(false);
    }
  };

  const roomsByFloor = rooms.reduce((acc, room) => {
    const floor = room.floor || "Khác";
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  const formatLocalYMD = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleSetDefaultDates = () => {
    setCheckInDate(formatDate(today));
    setCheckOutDate(formatDate(dayLater));
  };

  const todayYMD = formatLocalYMD(new Date().toISOString());

  // Hàm xác định loại checkout - ĐÃ SỬA
  const getCheckoutType = (room) => {
    // Ưu tiên trường checkout trực tiếp từ API
    if (room?.checkout === "today") return "today";
    if (room?.checkout === "past") return "past";

    // Nếu không có checkout, thử tìm expectedCheckOutDate
    const possibleDate =
      room?.booking?.expectedCheckOutDate ||
      room?.currentBooking?.expectedCheckOutDate ||
      room?.expectedCheckOutDate ||
      null;

    if (!possibleDate) return null;

    const checkoutYMD = formatLocalYMD(possibleDate);
    if (!checkoutYMD) return null;

    if (checkoutYMD === todayYMD) return "today";
    if (checkoutYMD < todayYMD) return "past";

    return null;
  };

  const handleAddBookingClick = (roomId) => {
    const selectedRoom = rooms.find((room) => room._id === roomId);

    // Check actual status first
    if (selectedRoom?.status === "occupied") {
      setNotification({
        isOpen: true,
        message: "Phòng này đang có khách. Không thể tạo đặt phòng mới.",
      });
      return;
    }
    if (selectedRoom?.status === "booked") {
      setNotification({
        isOpen: true,
        message: "Phòng này đã được đặt trước. Không thể tạo đặt phòng mới.",
      });
      return;
    }
    if (selectedRoom?.status === "maintenance") {
      setNotification({
        isOpen: true,
        message: "Phòng đang bảo trì. Không thể tạo đặt phòng mới.",
      });
      return;
    }

    // Check visibleStatus for selected date range
    const visibleStatus = selectedRoom?.visibleStatus || selectedRoom?.status;
    if (visibleStatus === "booked") {
      setNotification({
        isOpen: true,
        message:
          "Phòng đã được đặt trong khoảng thời gian này. Vui lòng chọn ngày khác.",
      });
      return;
    }
    if (visibleStatus === "occupied") {
      setNotification({
        isOpen: true,
        message:
          "Phòng đang có khách trong khoảng thời gian này. Vui lòng chọn ngày khác.",
      });
      return;
    }

    // Check housekeeping status
    if (selectedRoom?.housekeepingStatus === "dirty") {
      setNotification({
        isOpen: true,
        message: "Phòng chưa dọn dẹp. Không thể tạo đặt phòng mới.",
      });
      return;
    }
    if (selectedRoom?.housekeepingStatus === "cleaning") {
      setNotification({
        isOpen: true,
        message:
          "Phòng đang được dọn dẹp. Vui lòng chờ trước khi tạo đặt phòng mới.",
      });
      return;
    }
    setShowActionPanel(false);
    setShowBookingForm(false);
    setSelectedRoomId(roomId);
    setShowBookingForm(true);
  };

  const handleRoomActionClick = (roomId) => {
    const room = rooms.find((r) => r._id === roomId);

    setShowActionPanel(false);
    setShowBookingForm(false);
    setActionRoom(room);
    setShowActionPanel(true);
  };

  // Component hiển thị nhãn checkout - CẢI THIỆN
  const CheckoutBadge = ({ room }) => {
    const checkoutType = getCheckoutType(room);

    // Debug: Log để xem có nhận được checkout type không
    console.log(
      `Room ${room.roomNumber}: status = "${room.status}", checkout = "${room?.checkout}", checkoutType = "${checkoutType}"`
    );

    // Chỉ hiển thị cho phòng đang occupied

    if (!checkoutType) return null;

    if (checkoutType === "today") {
      return (
        <div className="absolute left-1 bottom-1 bg-white text-xs text-yellow-700 font-semibold rounded px-0.5 py-0.5 shadow-sm border border-yellow-300">
          Trả phòng hôm nay
        </div>
      );
    }

    if (checkoutType === "past") {
      return (
        <div className="absolute left-1 bottom-1 bg-white text-xs text-red-600 font-semibold rounded px-0.5 py-0.5 shadow-sm border border-red-300">
          Trễ hạn trả phòng
        </div>
      );
    }

    return null;
  };
  return (
    <div className="relative p-6 space-y-6 overflow-hidden">
      {loading && <LoadingPage />}

      {/* Bộ lọc ngày nhận và trả phòng */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div>
          <label className="font-medium mr-2">Ngày nhận phòng:</label>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="font-medium mr-2">Ngày trả phòng:</label>
          <input
            type="date"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2"
          onClick={handleDateSubmit}
        >
          Xác nhận
        </button>
        <button
          type="button"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
          onClick={handleSetDefaultDates}
        >
          Mặt định
        </button>
      </div>

      <div className="text-sm text-gray-600 flex items-center">
        Chú thích màu phòng:
        <span className="inline-block w-4 h-4 bg-purple-500 mr-1 ml-2 rounded"></span>
        Không làm phiền
        <span className="inline-block w-4 h-4 bg-red-500 mr-1 ml-2 rounded"></span>
        Đang có khách
        <span className="inline-block w-4 h-4 bg-blue-500 mr-1 ml-2 rounded"></span>
        Chưa dọn dẹp
        <span className="inline-block w-4 h-4 bg-yellow-500 mr-1 ml-2 rounded"></span>
        Đã đặt trước
        <span className="inline-block w-4 h-4 bg-green-500 mr-1 ml-2 rounded"></span>
        Sẵn sàng cho khách
        <span className="inline-block w-4 h-4 bg-gray-500 mr-1 ml-2 rounded"></span>
        Đang bảo trì
      </div>

      {/* Room list */}
      {Object.entries(roomsByFloor).map(([floor, floorRooms]) => (
        <div key={floor} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
            Tầng {floor}
          </h2>
          <div className="flex flex-wrap gap-3">
            {floorRooms.map((room) => (
              <div
                key={room._id}
                className={`relative w-32 h-32 rounded text-white font-bold ${getStatusColor(
                  room
                )} flex flex-col items-center justify-center text-center text-base p-2 shadow-md hover:shadow-lg transition-shadow duration-200`}
              >
                {/* Icons góc trên bên phải */}
                <div className="absolute top-1 right-1 flex space-x-1">
                  <BsPersonFillAdd
                    className="text-white text-sm cursor-pointer hover:scale-110 transition w-5 h-5 hover:text-yellow-200"
                    onClick={() => handleAddBookingClick(room._id)}
                    title="Tạo đặt phòng"
                  />
                  <FaGear
                    className="text-white text-sm cursor-pointer hover:scale-110 transition w-5 h-5 hover:text-yellow-200"
                    onClick={() => handleRoomActionClick(room._id)}
                    title="Thao tác với phòng"
                  />
                </div>

                {/* Số phòng */}
                <div className="text-xl font-bold mb-1">{room.roomNumber}</div>

                {/* Loại phòng */}
                <div className="text-xs italic mb-1">{room?.typeid?.name}</div>

                {/* Giá phòng */}
                <div className="text-sm">
                  {room?.typeid?.pricePerNight?.toLocaleString() || 0}₫
                </div>

                {/* Hiển thị nhãn checkout ở góc trái dưới */}
                <CheckoutBadge room={room} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Slide-in form */}
      <CreateFullBookingForm
        initialRoomId={selectedRoomId}
        onBookingSuccess={fetchRoomDataAndUpdate}
        onClose={() => setShowBookingForm(false)}
        visible={showBookingForm}
      />

      {/* Slide-in Room Action Panel */}
      <RoomActionPanel
        visible={showActionPanel}
        onActionSuccess={fetchRoomDataAndUpdate}
        onClose={() => setShowActionPanel(false)}
        room={actionRoom}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        onClose={() => setNotification({ isOpen: false, message: "" })}
      />
    </div>
  );
}
