import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BookingSidebar from "../components/BookingSidebar";

const fetchBookingData = async (bookingId) => {
  const response = await fetch(`/api/booking/${bookingId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch booking data");
  }
  const data = await response.json();
  return data.booking;
};

const fetchAvailableRooms = async (checkInDate, checkOutDate) => {
  let url = `/api/room/available?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&client=true`;

  const response = await fetch(url);
  console.log(response);
  if (!response.ok) {
    throw new Error("Failed to fetch available rooms");
  }
  const data = await response.json();
  if (data.rooms?.length === 0) {
    alert("No available rooms found for the selected dates");
    throw new Error("No available rooms found for the selected dates");
  }
  console.log("Available rooms data:", data);
  return data.roomsByType;
};

export default function BookingRoom() {
  const { bookingId } = useParams();
  const [availableRooms, setAvailableRooms] = useState([]);
  const [booking, setBooking] = useState(null);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const navigate = useNavigate();

  if (!bookingId) navigate("/");

  // Function to show room detail modal
  const handleShowRoomDetail = (typeId) => {
    const rooms = filteredRooms[typeId];
    if (rooms && rooms.length > 0) {
      setSelectedRoomType(rooms[0].typeid);
      setShowRoomDetailModal(true);
    }
  };

  // Function to filter rooms based on booking requirements
  const filterRoomsForCurrentBooking = () => {
    console.log("=== FILTERING DEBUG ===");
    console.log("Booking:", booking);
    console.log("Booking rooms:", booking?.rooms);
    console.log("Available rooms:", availableRooms);
    console.log("Available rooms keys:", Object.keys(availableRooms || {}));

    if (
      booking &&
      booking.rooms &&
      availableRooms &&
      Object.keys(availableRooms).length > 0
    ) {
      // Find the first room that doesn't have a desiredRoomTypeId
      const roomToAssign = booking.rooms.find(
        (room) => !room.desiredRoomTypeId
      );

      console.log("Room to assign:", roomToAssign);
      console.log(
        "All booking rooms with desiredRoomTypeId:",
        booking.rooms.map((r) => ({
          hasDesiredType: !!r.desiredRoomTypeId,
          desiredRoomTypeId: r.desiredRoomTypeId,
          numberOfAdults: r.numberOfAdults,
        }))
      );

      if (!roomToAssign) {
        // All rooms already have room types assigned
        console.log("No room to assign - all rooms have desiredRoomTypeId");
        setFilteredRooms({});
        return;
      }

      // Get the number of adults for the room we're trying to assign
      const requiredAdults = roomToAssign.numberOfAdults || 0;

      // Filter room types that can accommodate the required capacity
      // Check maxGuest instead of capacity for extraBed support
      const filtered = {};
      Object.entries(availableRooms).forEach(([typeId, rooms]) => {
        // Check if this room type can accommodate the required number of adults
        const roomCapacity = rooms[0]?.typeid?.capacity || 0;
        const roomMaxGuest = rooms[0]?.typeid?.maxGuest || roomCapacity;
        const extraBedAllowed = rooms[0]?.typeid?.extraBedAllowed || false;

        // Check if capacity requirement is met using maxGuest
        const capacityOk = roomMaxGuest >= requiredAdults;

        // Debug: Log all room statuses
        console.log(
          `\n=== Room type ${typeId} (${rooms[0]?.typeid?.name}) ===`
        );
        console.log(`Total rooms: ${rooms.length}`);
        rooms.forEach((room, idx) => {
          console.log(
            `  Room ${idx + 1}: ${room.roomNumber} - Status: ${room.status}`
          );
        });

        // Check if there are any actually available rooms (not booked/occupied)
        const availableRoomsInType = rooms.filter(
          (room) => room.status === "available"
        );
        const bookedRoomsInType = rooms.filter(
          (room) => room.status === "booked"
        );
        const occupiedRoomsInType = rooms.filter(
          (room) => room.status === "occupied"
        );

        // Count how many rooms in current booking still need assignment and could use this room type
        const remainingRoomsNeedingAssignment = booking.rooms.filter(
          (r) => !r.desiredRoomTypeId
        );
        const roomsAlreadySelectedThisType = booking.rooms.filter(
          (r) =>
            r.desiredRoomTypeId && r.desiredRoomTypeId.toString() === typeId
        );

        // Calculate effective available rooms after removing current booking reservations
        const effectiveAvailableRooms = Math.max(
          0,
          availableRoomsInType.length - roomsAlreadySelectedThisType.length
        );

        console.log(
          `- Current booking already selected: ${roomsAlreadySelectedThisType.length} of this type`
        );
        console.log(
          `- Effective available rooms (after current booking): ${effectiveAvailableRooms}`
        );

        const hasAvailableRooms = effectiveAvailableRooms > 0;

        console.log(`- Available rooms: ${availableRoomsInType.length}`);
        console.log(`- Booked rooms: ${bookedRoomsInType.length}`);
        console.log(`- Occupied rooms: ${occupiedRoomsInType.length}`);
        console.log(
          `- Room capacity: ${roomCapacity}, Max guest: ${roomMaxGuest}, Required: ${requiredAdults}, Extra bed allowed: ${extraBedAllowed}`
        );
        console.log(
          `- Remaining rooms needing assignment: ${remainingRoomsNeedingAssignment.length}`
        );
        console.log(
          `- Rooms already selected this type: ${roomsAlreadySelectedThisType.length}`
        );
        console.log(
          `- Capacity OK: ${capacityOk}, Has available: ${hasAvailableRooms}`
        );

        // Only include room type if:
        // 1. Capacity is suitable for current room
        // 2. There are available rooms after excluding current booking's reservations
        if (capacityOk && hasAvailableRooms) {
          filtered[typeId] = rooms;
          console.log(`✅ INCLUDED room type ${typeId}`);
        } else {
          console.log(
            `❌ EXCLUDED room type ${typeId} - Capacity OK: ${capacityOk}, Has effective available: ${hasAvailableRooms}`
          );
        }
      });

      setFilteredRooms(filtered);
      console.log(
        "Filtered rooms by capacity for room needing assignment:",
        filtered
      );
      console.log("Room to assign:", roomToAssign);
    } else {
      console.log("Conditions not met for filtering:");
      console.log("- Has booking:", !!booking);
      console.log("- Has booking.rooms:", !!(booking && booking.rooms));
      console.log("- Has availableRooms:", !!availableRooms);
      console.log(
        "- Available rooms count:",
        Object.keys(availableRooms || {}).length
      );
    }
  };

  // Function to handle room selection
  const handleRoomSelection = async (typeId) => {
    try {
      const roomToAssignIndex = booking.rooms.findIndex(
        (room) => !room.desiredRoomTypeId
      );
      console.log("Room to assign index:", roomToAssignIndex);

      if (roomToAssignIndex === -1) {
        alert("Không tìm thấy phòng cần gán loại phòng");
        return;
      }

      const roomToAssign = booking.rooms[roomToAssignIndex];
      console.log("Room to assign:", roomToAssign);

      // Calculate the correct price including extra bed if needed
      const selectedRoomType = Object.values(availableRooms)
        .flat()
        .find((room) => room.typeid._id === typeId)?.typeid;

      const basePrice = selectedRoomType?.pricePerNight || 0;
      const extraBedPrice = selectedRoomType?.extraBedPrice || 0;
      const extraBedAllowed = selectedRoomType?.extraBedAllowed || false;
      const roomCapacity = selectedRoomType?.capacity || 0;
      const requiredAdults = roomToAssign.numberOfAdults || 0;

      const finalPricePerNight =
        requiredAdults > roomCapacity && extraBedAllowed
          ? basePrice + extraBedPrice
          : basePrice;

      const requestBody = {
        room: {
          index: roomToAssignIndex,
          desiredRoomTypeId: typeId,
          numberOfAdults: roomToAssign.numberOfAdults,
          numberOfChildren: roomToAssign.numberOfChildren,
          pricePerNight: finalPricePerNight,
        },
        additionalServices: booking.additionalServices || [],
      };

      console.log("Request body:", requestBody);

      const response = await fetch(`/api/booking/add-room/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        alert(`Lỗi khi chọn phòng: ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Refresh booking data and available rooms
      const bookingData = await fetchBookingData(bookingId);
      setBooking(bookingData);
      console.log("Updated booking data:", bookingData);

      if (data.success) {
        alert("Phòng đã được chọn thành công!");
        // Check if all rooms now have desiredRoomTypeId using the updated booking data
        if (bookingData.rooms.every((room) => room.desiredRoomTypeId)) {
          const updatedBooking = await fetchBookingData(bookingId);
          navigate(`/booking-service/${updatedBooking.bookingCode}`);
          return;
        }
      }

      // Refresh available rooms INCLUDING current booking to get true current state
      console.log("Fetching available rooms after room selection...");
      const rooms = await fetchAvailableRooms(
        bookingData.rooms[0].expectedCheckInDate,
        bookingData.rooms[0].expectedCheckOutDate
      );
      setAvailableRooms(rooms);
      console.log("Updated available rooms after selection:", rooms);

      // No need for manual filtering - useEffect will handle it automatically
    } catch (error) {
      console.error("Error in room selection:", error);
      alert(`Lỗi khi chọn phòng: ${error.message}`);
    }
  };

  // Function to handle room deletion (remove desiredRoomTypeId)
  const handleDeleteRoom = async (roomIndex) => {
    try {
      const response = await fetch(`/api/booking/remove-room/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomIndex }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        alert(`Lỗi khi xóa phòng: ${errorText}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        alert("Phòng đã được xóa thành công!");

        // Refresh booking data and available rooms
        const bookingData = await fetchBookingData(bookingId);
        setBooking(bookingData);
        console.log("Updated booking data after deletion:", bookingData);

        // Refresh available rooms WITHOUT excluding current booking first to get fresh data
        console.log("Fetching available rooms after room deletion...");
        const rooms = await fetchAvailableRooms(
          bookingData.rooms[0].expectedCheckInDate,
          bookingData.rooms[0].expectedCheckOutDate
        );
        setAvailableRooms(rooms);
        console.log("Updated available rooms after deletion:", rooms);

        // No need for manual filtering - useEffect will handle it automatically
      }
    } catch (error) {
      console.error("Error in room deletion:", error);
      alert(`Lỗi khi xóa phòng: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchBookingData(bookingId)
      .then((bookingData) => {
        console.log(bookingData);
        setBooking(bookingData);

        // Use the fetched booking data directly
        return fetchAvailableRooms(
          bookingData.rooms[0].expectedCheckInDate,
          bookingData.rooms[0].expectedCheckOutDate
        );
      })
      .then((rooms) => {
        setAvailableRooms(rooms);
        console.log("Available rooms:", rooms);
      })
      .catch((error) => {
        console.error("Error fetching booking or available rooms:", error);
      });
  }, [bookingId]);

  // Separate useEffect to handle filtering when booking or availableRooms change
  useEffect(() => {
    if (booking && availableRooms && Object.keys(availableRooms).length > 0) {
      filterRoomsForCurrentBooking();
    }
  }, [booking, availableRooms]);

  const totalNights = booking
    ? Math.ceil(
        (new Date(booking.expectedCheckOutDate) -
          new Date(booking.expectedCheckInDate)) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Main content */}
      <div className="flex-1 p-6">
        <div className=" p-6 rounded max-w-5xl mx-auto">
          <h1 className="text-3xl font-semibold">Chọn phòng</h1>
          <div className="mt-4  ">
            {Object.entries(filteredRooms).map(([typeId, rooms]) => (
              <div
                key={typeId}
                className="mb-4 flex p-4 rounded bg-white shadow-lg"
              >
                {rooms[0]?.typeid?.images?.[0]?.url ? (
                  <img
                    src={rooms[0].typeid.images[0].url}
                    alt={`Room ${rooms[0]?.typeid?.name}`}
                    className="w-60 h-40 object-cover"
                  />
                ) : (
                  <div className="w-60 h-40 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="ml-10 w-100">
                  <h2 className="text-4xl mb-2 font-semibold text-gray-800 pe-20">
                    {rooms[0]?.typeid?.name || "Không xác định"}
                  </h2>
                  <p className="  text-gray-500">
                    Số phòng trống: {rooms.length}
                  </p>
                  <p className="text-justify line-clamp-4">
                    {rooms[0]?.typeid.description || "Không có mô tả"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Sức chứa:
                    {rooms[0]?.typeid?.extraBedAllowed
                      ? ` ${rooms[0]?.typeid?.maxGuest || 0} người`
                      : `${rooms[0]?.typeid?.capacity || 0} người`}
                  </p>

                  {/* Amenities Preview */}
                  {rooms[0]?.typeid?.amenities &&
                    rooms[0].typeid.amenities.length > 0 && (
                      <div className="mt-3">
                        <div className="grid grid-cols-2 gap-2">
                          {rooms[0].typeid.amenities
                            .slice(0, 4)
                            .map((amenity) => (
                              <div
                                key={amenity}
                                className="flex items-center text-sm text-gray-700"
                              >
                                <span className="text-green-600 mr-1">✓</span>
                                <span className="truncate">
                                  {{
                                    wifi: "WiFi",
                                    air_conditioning: "Điều hòa",
                                    tv: "TV",
                                    minibar: "Minibar",
                                    balcony: "Ban công",
                                    sea_view: "Hướng biển",
                                    room_service: "Dịch vụ phòng",
                                    safe_box: "Két an toàn",
                                    coffee_maker: "Máy pha cà phê",
                                    hair_dryer: "Máy sấy tóc",
                                    bath_tub: "Bồn tắm",
                                    shower: "Vòi sen",
                                    desk: "Bàn làm việc",
                                    wardrobe: "Tủ quần áo",
                                    telephone: "Điện thoại",
                                    heating: "Sưởi ấm",
                                    kitchenette: "Bếp nhỏ",
                                  }[amenity] || amenity}
                                </span>
                              </div>
                            ))}
                        </div>
                        {rooms[0].typeid.amenities.length > 4 && (
                          <button
                            type="button"
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                            onClick={() => handleShowRoomDetail(typeId)}
                          >
                            + Xem thêm {rooms[0].typeid.amenities.length - 4}{" "}
                            tiện ích
                          </button>
                        )}
                      </div>
                    )}

                  <button
                    type="button"
                    className="mt-2 text-blue-700 hover:text-gray-300 cursor-pointer transition-colors duration-300 ease-in-out"
                    onClick={() => handleShowRoomDetail(typeId)}
                  >
                    XEM CHI TIẾT
                  </button>
                </div>
                <div className="flex flex-col gap-4 w-60 text-center">
                  <p className="text-gray-500 font-semibold">Đặt ngay với</p>
                  <h2 className="text-3xl font-semibold text-gray-800">
                    {(() => {
                      const roomToAssign = booking.rooms.find(
                        (room) => !room.desiredRoomTypeId
                      );
                      const requiredAdults = roomToAssign?.numberOfAdults || 0;
                      const roomCapacity = rooms[0]?.typeid?.capacity || 0;
                      const basePrice = rooms[0]?.typeid?.pricePerNight || 0;
                      const extraBedPrice =
                        rooms[0]?.typeid?.extraBedPrice || 0;
                      const extraBedAllowed =
                        rooms[0]?.typeid?.extraBedAllowed || false;

                      const totalPrice =
                        requiredAdults > roomCapacity && extraBedAllowed
                          ? basePrice + extraBedPrice
                          : basePrice;

                      return new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        currencyDisplay: "code",
                      }).format(totalPrice * totalNights);
                    })()}
                  </h2>

                  <button
                    type="button"
                    className="mt-2 px-5 py-3 w-35 bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded transition-colors duration-300 ease-in-out cursor-pointer mx-auto"
                    onClick={() => handleRoomSelection(typeId)}
                  >
                    Chọn phòng
                  </button>
                </div>
              </div>
            ))}
            {Object.keys(filteredRooms).length === 0 && booking && (
              <div className="text-center text-gray-500 mt-8">
                {booking.rooms?.every((room) => room.desiredRoomTypeId) ? (
                  <div>
                    <p>Tất cả các phòng đã được chọn loại phòng.</p>
                    <p className="text-sm mt-2">
                      Booking đã hoàn tất việc chọn phòng.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>Không có phòng nào phù hợp với yêu cầu của bạn.</p>
                    <p className="text-sm mt-2">
                      Yêu cầu cho phòng tiếp theo:{" "}
                      {booking.rooms?.find((room) => !room.desiredRoomTypeId)
                        ?.numberOfAdults || 0}{" "}
                      người lớn
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <BookingSidebar booking={booking} onDeleteRoom={handleDeleteRoom} />

      {/* Room Detail Modal */}
      {showRoomDetailModal && selectedRoomType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Phòng {selectedRoomType.name}
              </h2>
              <button
                onClick={() => setShowRoomDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Images */}
              {selectedRoomType.images &&
                selectedRoomType.images.length > 0 && (
                  <div className="mb-6">
                    <img
                      src={selectedRoomType.images[0].url}
                      alt={selectedRoomType.name}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                    {selectedRoomType.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {selectedRoomType.images.slice(1, 5).map((img, idx) => (
                          <img
                            key={idx}
                            src={img.url}
                            alt={`${selectedRoomType.name} ${idx + 2}`}
                            className="w-full h-24 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

              {/* Room Information */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Thông tin chung
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>
                      <span className="font-medium">Sức chứa:</span>{" "}
                      {selectedRoomType.capacity} người
                    </p>
                    {selectedRoomType.extraBedAllowed && (
                      <p>
                        <span className="font-medium">Số khách tối đa:</span>{" "}
                        {selectedRoomType.maxGuest} người (có giường phụ)
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Giá mỗi đêm:</span>{" "}
                      <span className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(selectedRoomType.pricePerNight)}
                      </span>
                    </p>
                    {selectedRoomType.extraBedAllowed &&
                      selectedRoomType.extraBedPrice > 0 && (
                        <p>
                          <span className="font-medium">Giá giường phụ:</span>{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(selectedRoomType.extraBedPrice)}
                          /đêm
                        </p>
                      )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Mô tả
                  </h3>
                  <p className="text-gray-600 text-justify leading-relaxed">
                    {selectedRoomType.description || "Không có mô tả"}
                  </p>
                </div>
              </div>

              {/* Amenities */}
              {selectedRoomType.amenities &&
                selectedRoomType.amenities.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Tiện ích
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedRoomType.amenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center bg-white rounded-lg p-3 shadow-sm"
                        >
                          <span className="text-2xl mr-3">✓</span>
                          <span className="text-gray-800 font-medium">
                            {{
                              wifi: "Truy cập Internet qua WiFi",
                              air_conditioning: "Điều hòa",
                              tv: "Truyền hình cáp/Vệ tinh",
                              minibar: "Quầy bar mini",
                              balcony: "Ban công",
                              sea_view: "Hướng biển",
                              room_service: "Phòng khách",
                              safe_box: "Két an toàn",
                              coffee_maker: "Máy pha cà phê",
                              hair_dryer: "Máy sấy tóc",
                              bath_tub: "Phòng có bồn tắm",
                              shower: "Vòi sen",
                              desk: "Bàn làm việc",
                              wardrobe: "Tủ quần áo",
                              telephone: "Điện thoại",
                              heating: "Sưởi ấm",
                              kitchenette: "Bếp nhỏ",
                            }[amenity] || amenity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowRoomDetailModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
