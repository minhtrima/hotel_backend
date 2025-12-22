import React, { useEffect, useState } from "react";
import CalendarDropdown from "../components/CalendarDropdown";
import BookingSidebar from "../components/BookingSidebar";
import { useNavigate, useParams } from "react-router-dom";
import { HiPlusCircle, HiOutlineMinusCircle } from "react-icons/hi";
import { FaTimes } from "react-icons/fa";

const showDate = (date) => {
  if (!date) return "";
  let day = date.getDate();
  if (day < 10) day = "0" + day;
  let month = date.getMonth() + 1;
  if (month < 10) month = "0" + month;
  const year = date.getFullYear();
  return `${day} Tháng ${month}, ${year}`;
};

const fetchBookingData = async (bookingId) => {
  const response = await fetch(`/api/booking/${bookingId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch booking data");
  }
  const data = await response.json();
  return data.booking;
};

export default function Booking() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [dayStart, setDayStart] = useState(null);
  const [dayEnd, setDayEnd] = useState(null);
  const [roomCount, setRoomCount] = useState(1);
  const [rooms, setRooms] = useState([
    { status: "pending", numberOfAdults: 2, numberOfChildren: 0 },
  ]);
  const [showCalendar, setShowCalendar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookingData(bookingId)
      .then((bookingData) => {
        setBooking(bookingData);
        setDayStart(
          bookingData.expectedCheckInDate
            ? new Date(bookingData.expectedCheckInDate)
            : null
        );
        setDayEnd(
          bookingData.expectedCheckOutDate
            ? new Date(bookingData.expectedCheckOutDate)
            : null
        );
        setRoomCount(bookingData.rooms.length);
        setRooms(
          bookingData.rooms.map((room) => ({
            status: room.status,
            numberOfAdults: room.numberOfAdults,
            numberOfChildren: room.numberOfChildren,
          }))
        );
      })
      .catch((error) => {
        console.error("Error fetching booking data:", error);
      });
  }, [bookingId]);

  const addRoom = () => {
    setRooms((prevRooms) => [
      ...prevRooms,
      { status: "pending", numberOfAdults: 1, numberOfChildren: 0 },
    ]);
    setRoomCount((prevCount) => prevCount + 1);
  };

  const removeRoom = (index) => {
    if (roomCount == 1) return;
    setRooms((prevRooms) => prevRooms.filter((_, i) => i !== index));
    setRoomCount((prevCount) => Math.max(prevCount - 1, 1));
  };

  const handleSubmit = async () => {
    // Validate room data
    const validatedRooms = rooms.map((room) => ({
      ...room,
      numberOfAdults: Math.max(1, room.numberOfAdults),
      numberOfChildren: Math.max(0, room.numberOfChildren),
    }));

    setRooms(validatedRooms);

    // Create booking object
    const bookingData = {
      expectedCheckInDate: dayStart,
      expectedCheckOutDate: dayEnd,
      rooms: validatedRooms.map((room) => ({
        status: "pending",
        numberOfAdults: room.numberOfAdults,
        numberOfChildren: room.numberOfChildren,
        expectedCheckInDate: dayStart,
        expectedCheckOutDate: dayEnd,
      })),
    };

    console.log("Booking data:", bookingData);
    const response = await fetch(`/api/booking/update/temp/${bookingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });
    const data = await response.json();
    if (data.success) {
      alert("Booking updated successfully!");
      const updatedBooking = await fetchBookingData(bookingId);
      navigate("/booking-room/" + updatedBooking.bookingCode);
    } else {
      alert("Failed to update booking: " + data.message);
    }
  };

  // --- NEW: handle calendar dropdown accept ---
  const handleCalendarAccept = (start, end) => {
    setDayStart(start);
    setDayEnd(end);
    // Only close if both dates are selected
    if (start && end) {
      setShowCalendar(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Main content */}
      <div className="flex-1 p-6 rounded shadow-lg  mx-auto mt-5">
        <h1 className="text-3xl font-semibold">
          Bạn muốn đặt bao nhiêu phòng?
        </h1>
        <div className="mt-6 flex flex-col gap-4 bg-white p-6">
          <div className="flex w-full items-center relative">
            <label className="text-lg font-semibold me-5 whitespace-nowrap">
              Chọn ngày:
            </label>
            <div
              className="border border-gray-300 rounded p-2 w-[500px] cursor-pointer"
              onClick={() => setShowCalendar(true)}
            >
              {showDate(dayStart) || "Chưa chọn ngày"} -{" "}
              {showDate(dayEnd) || "Chưa chọn ngày"}
            </div>
            {showCalendar && (
              <div className="absolute left-0 top-14 z-50">
                {/* Use onMouseDown instead of onClick to close earlier in event flow */}
                <div
                  className="fixed inset-0 z-40"
                  onMouseDown={() => setShowCalendar(false)}
                  style={{ top: 0, left: 0, width: "100vw", height: "100vh" }}
                />
                <div
                  className="relative z-50"
                  onMouseDown={(e) => e.stopPropagation()} // just stopMouseDown
                >
                  <CalendarDropdown
                    startDay={dayStart}
                    endDay={dayEnd}
                    onChange={(start, end) => {
                      handleCalendarAccept(start, end);
                    }}
                    onClose={() => setShowCalendar(false)}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex w-full gap-20">
            <label className="text-lg font-semibold ">Số lượng phòng:</label>
            <p
              type="number"
              name="roomCount"
              className="p-1 font-semibold text-gray-700 "
            >
              {roomCount}
            </p>
            <div className="flex items-center">
              <button
                type="button"
                className="m-1 rounded-full flex items-center justify-center text-2xl font-bold cursor-pointer"
                onClick={() => removeRoom(roomCount - 1)}
              >
                <HiOutlineMinusCircle />
              </button>

              <button
                type="button"
                className="m-1 rounded-full flex items-center justify-center text-blue-500 text-2xl font-bold cursor-pointer"
                onClick={addRoom}
              >
                <HiPlusCircle />
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-col w-full gap-4">
            {rooms.map((room, index) => (
              <div key={index} className="flex items-center gap-20">
                <label
                  htmlFor={`room-${index}`}
                  className="text-lg font-semibold me-5 whitespace-nowrap flex items-center"
                >
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    Phòng {index + 1}
                  </span>
                  <span className="ms-1">:</span>
                </label>
                <div className="flex  gap-10 items-center">
                  <p>Người lớn:</p>
                  <p>{room.numberOfAdults}</p>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="m-1 rounded-full flex items-center justify-center text-2xl font-bold cursor-pointer"
                      onClick={() =>
                        setRooms((prevRooms) => {
                          const updatedRooms = [...prevRooms];
                          updatedRooms[index].numberOfAdults =
                            updatedRooms[index].numberOfAdults > 1
                              ? updatedRooms[index].numberOfAdults - 1
                              : 1;
                          return updatedRooms;
                        })
                      }
                    >
                      <HiOutlineMinusCircle />
                    </button>

                    <button
                      type="button"
                      className="m-1 rounded-full flex items-center justify-center text-blue-500 text-2xl font-bold cursor-pointer"
                      onClick={() =>
                        setRooms((prevRooms) => {
                          const updatedRooms = [...prevRooms];
                          updatedRooms[index].numberOfAdults =
                            updatedRooms[index].numberOfAdults < 3
                              ? updatedRooms[index].numberOfAdults + 1
                              : 3;
                          return updatedRooms;
                        })
                      }
                    >
                      <HiPlusCircle />
                    </button>
                  </div>
                </div>
                <div className="flex gap-10 items-center">
                  <p>Trẻ em:</p>
                  <p>{room.numberOfChildren}</p>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="m-1 rounded-full flex items-center justify-center text-2xl font-bold cursor-pointer"
                      onClick={() =>
                        setRooms((prevRooms) => {
                          const updatedRooms = [...prevRooms];
                          updatedRooms[index].numberOfChildren =
                            updatedRooms[index].numberOfChildren > 0
                              ? updatedRooms[index].numberOfChildren - 1
                              : 0;
                          return updatedRooms;
                        })
                      }
                    >
                      <HiOutlineMinusCircle />
                    </button>

                    <button
                      type="button"
                      className="m-1 rounded-full flex items-center justify-center text-blue-500 text-2xl font-bold cursor-pointer"
                      onClick={() =>
                        setRooms((prevRooms) => {
                          const updatedRooms = [...prevRooms];
                          updatedRooms[index].numberOfChildren =
                            updatedRooms[index].numberOfChildren < 2
                              ? updatedRooms[index].numberOfChildren + 1
                              : 2;
                          return updatedRooms;
                        })
                      }
                    >
                      <HiPlusCircle />
                    </button>
                  </div>
                </div>
                <button type="button">
                  <FaTimes
                    className="text-red-500 text-2xl cursor-pointer"
                    onClick={() => removeRoom(index)}
                  />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="w-40 px-5 py-1 bg-blue-500 text-white hover:bg-blue-700 cursor-pointer rounded-md"
              onClick={addRoom}
            >
              + Thêm phòng
            </button>
          </div>{" "}
        </div>

        <button
          type="button"
          className="mt-15 px-10 py-3 bg-blue-500 text-white text-lg font-semibold hover:bg-blue-700 cursor-pointer rounded-md"
          onClick={handleSubmit}
        >
          Tiếp tục
        </button>
      </div>

      {/* Sidebar */}
      <BookingSidebar booking={booking} />
    </div>
  );
}
