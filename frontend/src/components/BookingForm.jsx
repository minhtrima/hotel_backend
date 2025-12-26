// Updated BookingForm for Multi-Room Support
import React, { useEffect, useState } from "react";
import BookingInput from "../components/BookingInput";
import AdditionalGuestsInput from "./AdditionalGuestsInput";
import NotificationModal from "./NotificationModal";
import ConfirmModal from "./ConfirmModal";
import MainGuestInput from "./MainGuestInput";

export default function BookingForm({ isCheckin = false, customerId }) {
  const [formData, setFormData] = useState({
    customerid: customerId,
    rooms: [
      {
        desiredRoomTypeId: "",
        roomid: "",
        numberOfAdults: 1,
        numberOfChildren: 0,
        extraBedAdded: false,
        pricePerNight: 0,
        expectedCheckInDate: "",
        expectedCheckInTime: "",
        expectedCheckOutDate: "",
        expectedCheckOutTime: "",
        mainGuest: {
          fullName: "",
          dateOfBirth: "",
          identificationNumber: "",
          phoneNumber: "",
          nationality: "",
        },
        additionalGuests: [],
      },
    ],
    specialRequests: "",
    internalNotes: "",
    status: isCheckin ? "checked_in" : "booked",
  });

  const [formErrors, setFormErrors] = useState({});
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    fetch("/api/room")
      .then((res) => res.json())
      .then((data) => setRooms(data.rooms))
      .catch(() =>
        setNotification({
          isOpen: true,
          title: "Lỗi",
          message: "Không thể tải dữ liệu phòng",
        })
      );

    fetch("/api/type")
      .then((res) => res.json())
      .then((data) => setRoomTypes(data.types))
      .catch(() =>
        setNotification({
          isOpen: true,
          title: "Lỗi",
          message: "Không thể tải dữ liệu loại phòng",
        })
      );

    fetch(`/api/customer/${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        // Set first room's mainGuest if not already set
        setFormData((prev) => {
          if (!data.customer) return prev;
          const rooms = [...prev.rooms];
          if (rooms.length > 0) {
            rooms[0].mainGuest = {
              fullName: data.customer.fullName || "",
              dateOfBirth: data.customer.dateOfBirth
                ? new Date(data.customer.dateOfBirth)
                    .toISOString()
                    .split("T")[0]
                : "",
              identificationNumber: data.customer.identificationNumber || "",
              phoneNumber: data.customer.phoneNumber || "",
              nationality: data.customer.nationality || "",
              email: data.customer.email || "",
              specialRequests: "",
            };
          }
          return { ...prev, rooms };
        });
      })
      .catch(() =>
        setNotification({
          isOpen: true,
          title: "Lỗi",
          message: "Không thể tải thông tin khách hàng",
        })
      );
  }, [customerId]);

  const handleRoomChange = (index, field, value) => {
    const updatedRooms = [...formData.rooms];

    console.log(index, field, value);
    if (field === "numberOfAdults" || field === "numberOfChildren") {
      const newCount = Number(value);
      updatedRooms[index][field] = newCount;

      // Calculate total guests for additional guests array
      const numberOfAdults =
        field === "numberOfAdults"
          ? newCount
          : updatedRooms[index].numberOfAdults || 1;
      const numberOfChildren =
        field === "numberOfChildren"
          ? newCount
          : updatedRooms[index].numberOfChildren || 0;
      const totalGuests = numberOfAdults + numberOfChildren;

      // Check if extra bed is forced based on room capacity
      const selectedTypeId = updatedRooms[index].desiredRoomTypeId;
      const selectedType = roomTypes.find((t) => t._id === selectedTypeId);
      if (selectedType) {
        const capacity = Number(selectedType.capacity);
        const basePrice = Number(selectedType.pricePerNight);

        // Force extra bed if adults exceed capacity
        if (numberOfAdults > capacity) {
          updatedRooms[index].extraBedAdded = true;
          updatedRooms[index].pricePerNight =
            basePrice + (selectedType.extraBedPrice || 0);
        } else {
          // Keep user's choice if within capacity, but update pricing
          const extraBedPrice = updatedRooms[index].extraBedAdded
            ? selectedType.extraBedPrice || 0
            : 0;
          updatedRooms[index].pricePerNight = basePrice + extraBedPrice;
        }
      }

      // Adjust additional guests array (total guests - 1 for mainGuest)
      let currentGuests = updatedRooms[index].additionalGuests || [];
      const targetLength = Math.max(0, totalGuests - 1);

      if (currentGuests.length < targetLength) {
        // Add new guests
        for (let i = currentGuests.length; i < targetLength; i++) {
          currentGuests.push({
            fullName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
            isChild: false,
          });
        }
      } else if (currentGuests.length > targetLength) {
        // Remove excess guests
        currentGuests = currentGuests.slice(0, targetLength);
      }

      updatedRooms[index].additionalGuests = currentGuests;
    } else if (field === "extraBedAdded") {
      const isChecked = Boolean(value);
      updatedRooms[index][field] = isChecked;

      // Update pricing based on extra bed selection
      const selectedTypeId = updatedRooms[index].desiredRoomTypeId;
      const selectedType = roomTypes.find((t) => t._id === selectedTypeId);

      if (selectedType) {
        const basePrice = Number(selectedType.pricePerNight);
        const extraBedPrice = isChecked
          ? Number(selectedType.extraBedPrice || 0)
          : 0;
        updatedRooms[index].pricePerNight = basePrice + extraBedPrice;
      }
    } else if (field === "desiredRoomTypeId") {
      const selectedType = roomTypes.find((t) => t._id === value);
      if (selectedType) {
        const capacity = Number(selectedType.capacity);
        const numberOfAdults = updatedRooms[index].numberOfAdults || 1;
        const basePrice = Number(selectedType.pricePerNight);

        // Force extra bed if adults exceed capacity
        if (numberOfAdults > capacity) {
          updatedRooms[index].extraBedAdded = true;
          updatedRooms[index].pricePerNight =
            basePrice + (selectedType.extraBedPrice || 0);
        } else {
          // Keep current extra bed choice if within capacity
          const extraBedPrice = updatedRooms[index].extraBedAdded
            ? selectedType.extraBedPrice || 0
            : 0;
          updatedRooms[index].pricePerNight = basePrice + extraBedPrice;
        }

        updatedRooms[index].roomid = "";
        updatedRooms[index][field] = value;

        // Keep current adults/children, just update additional guests based on total
        const numberOfChildren = updatedRooms[index].numberOfChildren || 0;
        const totalGuests = numberOfAdults + numberOfChildren;

        const newGuests = [];
        for (let i = 0; i < Math.max(0, totalGuests - 1); i++) {
          newGuests.push({
            fullName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
            isChild: false,
          });
        }
        updatedRooms[index].additionalGuests = newGuests;
      }
      updatedRooms[index][field] = value;
    } else if (field === "roomid") {
      const selectedRoom = rooms.find((r) => r._id === value);
      if (selectedRoom && selectedRoom.typeid) {
        const capacity = Number(selectedRoom.typeid.capacity);
        const numberOfAdults = updatedRooms[index].numberOfAdults || 1;
        const basePrice = Number(selectedRoom.typeid.pricePerNight);

        // Force extra bed if adults exceed capacity
        if (numberOfAdults > capacity) {
          updatedRooms[index].extraBedAdded = true;
          updatedRooms[index].pricePerNight =
            basePrice + (selectedRoom.typeid.extraBedPrice || 0);
        } else {
          // Keep current extra bed choice if within capacity
          const extraBedPrice = updatedRooms[index].extraBedAdded
            ? selectedRoom.typeid.extraBedPrice || 0
            : 0;
          updatedRooms[index].pricePerNight = basePrice + extraBedPrice;
        }

        // Keep current adults/children, just update additional guests
        const numberOfChildren = updatedRooms[index].numberOfChildren || 0;
        const totalGuests = numberOfAdults + numberOfChildren;

        const newGuests = [];
        for (let i = 0; i < Math.max(0, totalGuests - 1); i++) {
          newGuests.push({
            fullName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
            isChild: false,
          });
        }
        updatedRooms[index].additionalGuests = newGuests;
      }
      updatedRooms[index][field] = value;
    } else {
      updatedRooms[index][field] = value;
    }

    setFormData((prevData) => ({
      ...prevData,
      rooms: updatedRooms,
    }));
  };

  const handleMainGuestChange = (roomIndex, e) => {
    const { name, value } = e.target;
    const updatedRooms = [...formData.rooms];
    updatedRooms[roomIndex].mainGuest = {
      ...updatedRooms[roomIndex].mainGuest,
      [name]: value,
    };
    setFormData({ ...formData, rooms: updatedRooms });
  };

  const handleAddRoom = () => {
    setFormData({
      ...formData,
      rooms: [
        ...formData.rooms,
        {
          desiredRoomTypeId: "",
          roomid: "",
          numberOfAdults: 1,
          numberOfChildren: 0,
          extraBedAdded: false,
          pricePerNight: 0,
          expectedCheckInDate: "",
          expectedCheckInTime: "",
          expectedCheckOutDate: "",
          expectedCheckOutTime: "",
          mainGuest: {
            fullName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
          },
          additionalGuests: [],
        },
      ],
    });
  };

  const handleRemoveRoom = (index) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms.splice(index, 1);
    setFormData({ ...formData, rooms: updatedRooms });
  };

  const handleGuestChange = (roomIndex, guestIndex, field, value) => {
    const updatedRooms = [...formData.rooms];
    updatedRooms[roomIndex].additionalGuests[guestIndex][field] = value;
    setFormData({ ...formData, rooms: updatedRooms });
  };

  const validateForm = () => {
    const errors = {};
    formData.rooms.forEach((room, index) => {
      const roomErrors = {};
      if (!room.desiredRoomTypeId)
        roomErrors.desiredRoomTypeId = "Loại phòng là bắt buộc";
      if (!room.pricePerNight || room.pricePerNight <= 0)
        roomErrors.pricePerNight = "Giá phải > 0";
      if (!room.numberOfAdults || room.numberOfAdults <= 0)
        roomErrors.numberOfAdults = "Số người lớn phải >= 1";
      if (room.numberOfChildren < 0)
        roomErrors.numberOfChildren = "Số trẻ em phải >= 0";
      if (!room.expectedCheckInDate || !room.expectedCheckOutDate) {
        roomErrors.expectedCheckInDate = "Chọn ngày nhận và trả phòng";
      } else if (
        new Date(room.expectedCheckInDate) > new Date(room.expectedCheckOutDate)
      ) {
        roomErrors.expectedCheckOutDate = "Ngày trả phải sau ngày nhận";
      }
      if (Object.keys(roomErrors).length > 0) errors[index] = roomErrors;
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setNotification({
        isOpen: true,
        title: "Lỗi",
        message: "Vui lòng kiểm tra lại thông tin",
      });
      return;
    }
    setConfirmModal({
      isOpen: true,
      message: isCheckin
        ? "Bạn có chắc chắn muốn check-in khách này?"
        : "Bạn có chắc chắn muốn đặt phòng?",
    });
  };

  const submitBooking = async () => {
    try {
      const payload = { ...formData };
      if (isCheckin) {
        const today = new Date().toISOString().split("T")[0];
        payload.rooms = payload.rooms.map((room) => ({
          ...room,
          actualCheckInDate: today,
        }));
      }

      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      setNotification({
        isOpen: true,
        title: "Thành công",
        message: "Đặt phòng thành công!",
      });
    } catch (error) {
      setNotification({ isOpen: true, title: "Lỗi", message: error.message });
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formData.rooms.map((room, index) => (
          <div key={index} className="p-4 border rounded-md shadow-md">
            <div className="md:grid md:grid-cols-2 md:gap-6">
              <div>
                <BookingInput
                  formData={{
                    ...room,
                    specialRequests: formData.specialRequests,
                    internalNotes: formData.internalNotes,
                  }}
                  formErrors={formErrors[index] || {}}
                  onChange={(e) => {
                    // Handle booking-level fields
                    if (
                      e.target.name === "specialRequests" ||
                      e.target.name === "internalNotes"
                    ) {
                      setFormData((prevData) => ({
                        ...prevData,
                        [e.target.name]: e.target.value,
                      }));
                    } else {
                      // Handle room-level fields
                      handleRoomChange(index, e.target.name, e.target.value);
                    }
                  }}
                  rooms={rooms}
                  roomTypes={roomTypes}
                  checkInNow={false}
                />
                <AdditionalGuestsInput
                  guests={room.additionalGuests.slice(
                    0,
                    Math.max(
                      0,
                      (room.numberOfAdults || 1) +
                        (room.numberOfChildren || 0) -
                        1
                    )
                  )}
                  onChange={(guestIndex, field, value) =>
                    handleGuestChange(index, guestIndex, field, value)
                  }
                  onAdd={() => {
                    const updatedRooms = [...formData.rooms];
                    // Don't automatically increment adults/children - user manages that manually
                    setFormData({ ...formData, rooms: updatedRooms });
                  }}
                  onRemove={(guestIndex) => {
                    const updatedRooms = [...formData.rooms];
                    const totalGuests =
                      (updatedRooms[index].numberOfAdults || 1) +
                      (updatedRooms[index].numberOfChildren || 0);
                    if (totalGuests > 1) {
                      updatedRooms[index].additionalGuests.splice(
                        guestIndex,
                        1
                      );
                      setFormData({ ...formData, rooms: updatedRooms });
                    }
                  }}
                  formErrors={formErrors[index]?.additionalGuests || {}}
                />
              </div>
              <div>
                <MainGuestInput
                  mainGuest={room.mainGuest}
                  onChange={(e) => handleMainGuestChange(index, e)}
                  formErrors={formErrors[index]?.mainGuest || {}}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveRoom(index)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 cursor-pointer transition"
            >
              Xoá phòng này
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddRoom}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer transition"
        >
          + Thêm phòng
        </button>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-3 px-4 mt-5 rounded-lg shadow-lg hover:bg-blue-700"
        >
          {isCheckin ? "Check In" : "Đặt phòng"}
        </button>
      </form>

      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          setConfirmModal({ ...confirmModal, isOpen: false });
          submitBooking();
        }}
      />
    </>
  );
}
