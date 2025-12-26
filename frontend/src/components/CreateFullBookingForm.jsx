import { useState, useEffect, useRef } from "react";
import CustomerInput from "./CustomerInput";
import BookingInput from "./BookingInput";
import AdditionalGuestsInput from "./AdditionalGuestsInput";
import NotificationModal from "./NotificationModal";
import ConfirmModal from "./ConfirmModal";

export default function CreateFullBookingForm({
  initialRoomId = "",
  onBookingSuccess,
  onClose,
  visible,
}) {
  const [customerData, setCustomerData] = useState({
    honorific: "Ông",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    identification: "national_id",
    identificationNumber: "",
    nationality: "",
    dateOfBirth: "",
  });

  const currentDate = new Date().toISOString().split("T")[0];

  const [bookingData, setBookingData] = useState({
    customerid: "",
    rooms: [
      {
        desiredRoomTypeId: "",
        roomid: initialRoomId,
        numberOfGuests: 1,
        pricePerNight: 0,
        expectedCheckInDate: currentDate,
        expectedCheckOutDate: (() => {
          const checkIn = new Date(currentDate);
          checkIn.setDate(checkIn.getDate() + 3);
          return checkIn.toISOString().split("T")[0];
        })(),
        mainGuest: {
          firstName: "",
          lastName: "",
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
    status: "booked",
  });

  const [errors, setErrors] = useState({});
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("Thông báo");

  const formRef = useRef(null);

  // Fetch room types and rooms
  useEffect(() => {
    fetch("/api/type")
      .then((res) => res.json())
      .then((data) =>
        setRoomTypes(
          data.types.map((type) => ({
            id: type._id,
            name: type.name,
            capacity: type.capacity,
            pricePerNight: type.pricePerNight,
          }))
        )
      )
      .then(() => console.log(roomTypes))
      .catch((err) => console.error("Failed to load room types:", err));
  }, []);

  useEffect(() => {
    fetch("/api/room")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setRooms(
          data.rooms.map((room) => ({
            id: room._id,
            roomNumber: room.roomNumber,
            type: room.typeid?.name || "Không rõ",
            typeId: room.typeid?._id || "",
            floor: room.floor,
            status: room.status,
            pricePerNight: room.typeid?.pricePerNight || 0,
            capacity: room.typeid?.capacity || 1,
          }))
        );
      })
      .catch((err) => console.error("Failed to load rooms:", err));
  }, [initialRoomId]);

  // Khi load, nếu có initialRoomId thì tự động chọn loại phòng theo room[0], nếu không thì để desiredRoomTypeId là ""
  useEffect(() => {
    if (initialRoomId && rooms.length > 0 && roomTypes.length > 0) {
      const selectedRoom = rooms.find((room) => room.id === initialRoomId);
      if (selectedRoom) {
        // Tính số khách phụ (số khách - 1)
        const guestCount = selectedRoom.capacity || 1;
        const additionalGuests = [];
        for (let i = 0; i < guestCount - 1; i++) {
          additionalGuests.push({
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
          });
        }
        setBookingData((prev) => ({
          ...prev,
          rooms: [
            {
              ...prev.rooms[0],
              roomid: selectedRoom.id,
              desiredRoomTypeId: selectedRoom.typeId,
              numberOfGuests: guestCount,
              pricePerNight: selectedRoom.pricePerNight || 0,
              additionalGuests: additionalGuests, // set đúng số lượng khách phụ
            },
          ],
        }));
      }
    } else if (!initialRoomId) {
      // Nếu không có initialRoomId, KHÔNG chọn loại phòng mặc định, số khách phụ = numberOfGuests - 1
      setBookingData((prev) => {
        const guestCount = prev.rooms[0].numberOfGuests || 1;
        const additionalGuests = [];
        for (let i = 0; i < guestCount - 1; i++) {
          additionalGuests.push({
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
          });
        }
        return {
          ...prev,
          rooms: [
            {
              ...prev.rooms[0],
              desiredRoomTypeId: "",
              numberOfGuests: 1,
              pricePerNight: 0,
              additionalGuests: additionalGuests,
            },
          ],
        };
      });
    }
  }, [initialRoomId, rooms, roomTypes]);

  // Khi chọn loại phòng, cập nhật số khách và giá theo loại phòng
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => {
      const updatedRooms = [...prev.rooms];
      if (name === "desiredRoomTypeId") {
        updatedRooms[0].desiredRoomTypeId = value;
        const selectedType = roomTypes.find((type) => type.id === value);
        console.log(selectedType);
        if (selectedType) {
          updatedRooms[0].pricePerNight = selectedType.pricePerNight || 0;
          updatedRooms[0].numberOfGuests = selectedType.capacity || 1;
        }
        updatedRooms[0].roomid = ""; // reset chọn phòng cụ thể nếu đổi loại phòng
      } else if (name === "roomid") {
        updatedRooms[0].roomid = value;
        const selectedRoom = rooms.find((room) => room.id === value);
        if (selectedRoom) {
          updatedRooms[0].desiredRoomTypeId = selectedRoom.typeId;
          updatedRooms[0].pricePerNight = selectedRoom.pricePerNight || 0;
          updatedRooms[0].numberOfGuests = selectedRoom.capacity || 1;
        }
      } else if (name === "numberOfGuests") {
        updatedRooms[0].numberOfGuests = Number(value);
      } else if (
        name === "expectedCheckInDate" ||
        name === "expectedCheckOutDate"
      ) {
        updatedRooms[0][name] = value;
      } else if (name === "pricePerNight") {
        updatedRooms[0].pricePerNight = Number(value);
      }
      // Khi thay đổi số khách, cập nhật số lượng additionalGuests
      if (
        name === "numberOfGuests" ||
        name === "desiredRoomTypeId" ||
        name === "roomid"
      ) {
        const guestCount = updatedRooms[0].numberOfGuests || 1;
        let guests = updatedRooms[0].additionalGuests || [];
        const requiredLength = Math.max(guestCount - 1, 0);
        if (guests.length < requiredLength) {
          for (let i = guests.length; i < requiredLength; i++) {
            guests.push({
              firstName: "",
              lastName: "",
              dateOfBirth: "",
              identificationNumber: "",
              nationality: "",
            });
          }
        } else if (guests.length > requiredLength) {
          guests = guests.slice(0, requiredLength);
        }
        updatedRooms[0].additionalGuests = guests;
      }
      // Khi thay đổi customer, đồng bộ mainGuest
      updatedRooms[0].mainGuest = {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        dateOfBirth: customerData.dateOfBirth,
        identificationNumber: customerData.identificationNumber,
        phoneNumber: customerData.phoneNumber,
        nationality: customerData.nationality,
      };
      return { ...prev, rooms: updatedRooms };
    });
  };

  // Khi thay đổi thông tin khách hàng, đồng bộ mainGuest
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => {
      const updated = { ...prev, [name]: value };
      setBookingData((prevBooking) => {
        const updatedRooms = [...prevBooking.rooms];
        updatedRooms[0].mainGuest = {
          firstName: updated.firstName,
          lastName: updated.lastName,
          dateOfBirth: updated.dateOfBirth,
          identificationNumber: updated.identificationNumber,
          phoneNumber: updated.phoneNumber,
          nationality: updated.nationality,
        };
        return { ...prevBooking, rooms: updatedRooms };
      });
      return updated;
    });
  };

  // Thay đổi khách phụ
  const handleAdditionalGuestChange = (index, field, value) => {
    setBookingData((prev) => {
      const updatedRooms = [...prev.rooms];
      const guests = [...(updatedRooms[0].additionalGuests || [])];
      guests[index][field] = value;
      updatedRooms[0].additionalGuests = guests;
      return { ...prev, rooms: updatedRooms };
    });
  };

  const handleAdditionalGuestAdd = () => {
    setBookingData((prev) => {
      const updatedRooms = [...prev.rooms];
      updatedRooms[0].numberOfGuests += 1;
      updatedRooms[0].additionalGuests = [
        ...(updatedRooms[0].additionalGuests || []),
        {
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          identificationNumber: "",
          nationality: "",
        },
      ];
      return { ...prev, rooms: updatedRooms };
    });
  };

  const handleAdditionalGuestRemove = (index) => {
    setBookingData((prev) => {
      const updatedRooms = [...prev.rooms];
      const guests = [...(updatedRooms[0].additionalGuests || [])];
      guests.splice(index, 1);
      updatedRooms[0].additionalGuests = guests;
      updatedRooms[0].numberOfGuests = Math.max(
        1,
        updatedRooms[0].numberOfGuests - 1
      );
      return { ...prev, rooms: updatedRooms };
    });
  };

  // Validate
  const validateCustomer = (data) => {
    const errors = {};
    if (!data.firstName.trim()) errors.firstName = "Tên không được để trống.";
    if (!data.lastName.trim()) errors.lastName = "Họ không được để trống.";
    if (!data.email.trim()) {
      errors.email = "Email không được để trống.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Email không hợp lệ.";
    }
    if (!data.phoneNumber.trim())
      errors.phoneNumber = "Số điện thoại không được để trống.";
    if (!data.identificationNumber.trim())
      errors.identificationNumber = "Số giấy tờ tùy thân không được để trống.";
    if (!data.dateOfBirth.trim())
      errors.dateOfBirth = "Ngày sinh không được để trống.";
    return errors;
  };

  const validateBooking = (data) => {
    const errors = {};
    const room = data.rooms[0];
    if (!room.desiredRoomTypeId)
      errors.desiredRoomTypeId = "Loại phòng là bắt buộc";
    if (!room.pricePerNight || room.pricePerNight <= 0)
      errors.pricePerNight = "Giá phải > 0";
    if (!room.numberOfGuests || room.numberOfGuests <= 0)
      errors.numberOfGuests = "Số khách > 0";
    if (!room.expectedCheckInDate || !room.expectedCheckOutDate) {
      errors.expectedCheckInDate = "Chọn ngày nhận và trả phòng";
    } else if (
      new Date(room.expectedCheckInDate) > new Date(room.expectedCheckOutDate)
    ) {
      errors.expectedCheckOutDate = "Ngày trả phải sau ngày nhận";
    }
    return errors;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const customerErrors = validateCustomer(customerData);
    const bookingErrors = validateBooking(bookingData);

    setErrors({ ...customerErrors, ...bookingErrors });

    if (
      Object.keys(customerErrors).length > 0 ||
      Object.keys(bookingErrors).length > 0
    ) {
      setNotificationTitle("Lỗi");
      setNotificationMsg("Vui lòng điền đầy đủ và chính xác thông tin.");
      setShowNotification(true);
      return;
    }

    setShowConfirm(true);
  };

  // Xác nhận đặt phòng
  const handleConfirmBooking = async () => {
    setShowConfirm(false);

    // Submit customer first
    const customerRes = await fetch("/api/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData),
    });

    const customerResult = await customerRes.json();
    console.log(customerResult);

    if (!customerResult.success) {
      setNotificationTitle("Lỗi");
      setNotificationMsg("Customer creation failed");
      setShowNotification(true);
      return;
    }

    const newCustomerId = customerResult.customer._id;

    // Chuẩn hóa dữ liệu gửi lên backend
    const payload = {
      ...bookingData,
      customerid: newCustomerId,
      rooms: bookingData.rooms.map((room) => {
        const r = { ...room };
        if (!r.roomid) delete r.roomid;
        return r;
      }),
    };

    const bookingRes = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const bookingResult = await bookingRes.json();
    console.log(bookingResult);

    const checkInRes = await fetch(
      `/api/booking/checkin/${bookingResult.booking._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingResult.booking),
      }
    );

    const checkInResult = await checkInRes.json();

    if (checkInResult.success) {
      setNotificationTitle("Thành công");
      setNotificationMsg("Booking successful!");
      setShowNotification(true);
      if (typeof onBookingSuccess === "function") {
        onBookingSuccess();
      }
    } else {
      setNotificationTitle("Lỗi");
      setNotificationMsg("Booking failed!");
      setShowNotification(true);
    }
  };

  return (
    <>
      {visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/70"
          onClick={onClose} // Close when click outside
        >
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-white w-full max-w-5xl  max-h-[90vh] overflow-y-auto rounded-xl shadow-lg transition-all duration-300 p-6 relative"
            onClick={(e) => e.stopPropagation()} // Prevent close when click inside modal
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">Tạo đặt phòng</h2>
              <button
                onClick={onClose}
                className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-2xl cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 flex flex-row gap-6">
              {/* Customer Info Column */}
              <div className="w-1/2 flex flex-col gap-4">
                <h2 className="text-xl font-bold">Thông tin khách hàng</h2>
                <CustomerInput
                  formData={customerData}
                  formErrors={errors}
                  onChange={handleCustomerChange}
                />
              </div>

              {/* Booking Info Column */}
              <div className="w-1/2 flex flex-col gap-4">
                <h2 className="text-xl font-bold">Thông tin đặt phòng</h2>
                <BookingInput
                  formData={bookingData.rooms[0]}
                  formErrors={errors[0] || {}}
                  onChange={handleBookingChange}
                  rooms={rooms}
                  roomTypes={roomTypes}
                  checkInNow={true}
                  disableCheckIn={true}
                />
              </div>
            </div>
            <AdditionalGuestsInput
              guests={bookingData.rooms[0].additionalGuests}
              onChange={handleAdditionalGuestChange}
              onAdd={handleAdditionalGuestAdd}
              onRemove={handleAdditionalGuestRemove}
            />
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 cursor-pointer"
              >
                Tạo đặt phòng
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        message="Bạn có chắc chắn muốn tạo đặt phòng này?"
        onConfirm={handleConfirmBooking}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotification}
        title={notificationTitle}
        message={notificationMsg}
        onClose={() => setShowNotification(false)}
      />
    </>
  );
}
