import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "./DatePicker";
import RoomsModal from "./RoomsModal";

const showDate = (date) => {
  if (!date) return "";
  let day = date.getDate();
  if (day < 10) day = "0" + day;
  let month = date.getMonth() + 1;
  if (month < 10) month = "0" + month;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function BookingWidget() {
  const navigate = useNavigate();
  const [calendarModal, setCalendarModal] = useState(false);
  const [roomsModal, setRoomsModal] = useState(false);
  const [dayStart, setDayStart] = useState(null);
  const [dayEnd, setDayEnd] = useState(null);
  const [rooms, setRooms] = useState([
    { numberOfAdults: 2, numberOfChildren: 0 },
  ]);

  const handleSubmit = async () => {
    if (!dayStart || !dayEnd) {
      alert("Vui lòng chọn ngày nhận và trả phòng");
      return;
    }

    try {
      const response = await fetch("/api/booking/temporary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dayStart,
          dayEnd,
          rooms: rooms.map((room) => ({
            status: "pending",
            numberOfAdults: room.numberOfAdults,
            numberOfChildren: room.numberOfChildren,
            expectedCheckInDate: dayStart,
            expectedCheckOutDate: dayEnd,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to book room");

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Booking failed");

      navigate(`/booking-room/${data.booking._id}`);
    } catch (error) {
      console.error("Error booking room:", error);
      alert("Đặt phòng thất bại. Vui lòng thử lại.");
    }
  };

  const getTotalGuests = () => {
    const totalAdults = rooms.reduce(
      (sum, room) => sum + room.numberOfAdults,
      0
    );
    const totalChildren = rooms.reduce(
      (sum, room) => sum + room.numberOfChildren,
      0
    );
    return { adults: totalAdults, children: totalChildren };
  };

  const updateRoom = (index, field, value) => {
    setRooms((prev) =>
      prev.map((room, i) =>
        i === index
          ? {
              ...room,
              [field]: Math.max(field === "numberOfAdults" ? 1 : 0, value),
            }
          : room
      )
    );
  };

  const addRoom = () => {
    setRooms((prev) => [...prev, { numberOfAdults: 2, numberOfChildren: 0 }]);
  };

  const removeRoom = (index) => {
    if (rooms.length > 1) {
      setRooms((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Date Selection */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày nhận phòng
                </label>
                <button
                  onClick={() => setCalendarModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left hover:border-blue-500 transition-colors duration-200 flex items-center justify-between bg-white"
                >
                  <span className="text-gray-700">
                    {showDate(dayStart) || "Chọn ngày"}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày trả phòng
                </label>
                <button
                  onClick={() => setCalendarModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left hover:border-blue-500 transition-colors duration-200 flex items-center justify-between bg-white"
                >
                  <span className="text-gray-700">
                    {showDate(dayEnd) || "Chọn ngày"}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Guest Selection */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Khách
            </label>
            <button
              onClick={() => setRoomsModal(true)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left hover:border-blue-500 transition-colors duration-200 flex items-center justify-between bg-white"
            >
              <div className="flex items-center">
                <span className="text-red-500 mr-2">👤</span>
                <span className="text-gray-700">
                  {getTotalGuests().adults} người lớn,{" "}
                  {getTotalGuests().children} trẻ em
                </span>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Search Button */}
          <div className="lg:flex-none">
            <button
              onClick={handleSubmit}
              className="w-full lg:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              TÌM PHÒNG
            </button>
          </div>
        </div>
      </div>

      {/* DatePicker Modal */}
      <DatePicker
        isOpen={calendarModal}
        onClose={() => setCalendarModal(false)}
        startDay={dayStart}
        endDay={dayEnd}
        onDateSelect={(start, end) => {
          setDayStart(start);
          setDayEnd(end);
        }}
      />

      {/* Rooms Modal */}
      <RoomsModal
        isOpen={roomsModal}
        onClose={() => setRoomsModal(false)}
        rooms={rooms}
        setRooms={setRooms}
      />
    </>
  );
}
