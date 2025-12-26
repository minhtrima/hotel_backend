import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BookingInput from "./BookingInput";
import AdditionalGuestsInput from "./AdditionalGuestsInput";
import MainGuestInput from "./MainGuestInput";
import NotificationModal from "./NotificationModal";
import ConfirmModal from "./ConfirmModal";
import CheckInModal from "./CheckInModal";
import CheckOutModal from "./CheckOutModal";

export default function BookingDetailForm({ customerId: propCustomerId }) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState(null);

  const [formData, setFormData] = useState({
    customerid: propCustomerId || "",
    rooms: [
      {
        desiredRoomTypeId: "",
        roomid: "",
        numberOfAdults: 1,
        numberOfChildren: 0,
        pricePerNight: 0,
        expectedCheckInDate: "",
        expectedCheckInTime: "",
        expectedCheckOutDate: "",
        expectedCheckOutTime: "",
        mainGuest: {
          honorific: "",
          gender: "",
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

  const [formErrors, setFormErrors] = useState({});
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRoomTypesByIndex, setAvailableRoomTypesByIndex] = useState(
    {}
  );
  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
  });

  const [cancelConfirmModal, setCancelConfirmModal] = useState({
    isOpen: false,
    message: "Bạn có chắc muốn hủy đặt phòng này?",
  });

  const [checkOutConfirmModal, setCheckOutConfirmModal] = useState({
    isOpen: false,
    message: "Bạn có chắc chắn muốn trả phòng?",
  });
  const [checkInModal, setCheckInModal] = useState(false);

  // Save original form data for comparison
  const [originalFormData, setOriginalFormData] = useState(null);

  // Fetch customer data for add mode
  useEffect(() => {
    if (propCustomerId && !bookingId) {
      console.log(propCustomerId);
      fetch(`/api/customer/${propCustomerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCustomerData(data.customer);
            setFormData((prev) => {
              const updatedFormData = { ...prev, customerid: propCustomerId };

              // Fill customer info into first room's main guest
              if (updatedFormData.rooms && updatedFormData.rooms.length > 0) {
                updatedFormData.rooms[0].mainGuest = {
                  honorific: data.customer.honorific || "",
                  gender:
                    data.customer.honorific === "Ông"
                      ? "male"
                      : data.customer.honorific === "Bà"
                      ? "female"
                      : "",
                  firstName: data.customer.firstName || "",
                  lastName: data.customer.lastName || "",
                  phoneNumber: data.customer.phoneNumber || "",
                  dateOfBirth: data.customer.dateOfBirth
                    ? new Date(data.customer.dateOfBirth)
                        .toISOString()
                        .split("T")[0]
                    : "",
                  identificationNumber:
                    data.customer.identificationNumber || "",
                  nationality: data.customer.nationality || "",
                };
              }

              return updatedFormData;
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching customer data:", error);
        });
    }
  }, [propCustomerId, bookingId]);

  // Fetch booking data
  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/booking/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (!data.success) throw new Error(data.message);
        const bookingData = {
          ...data.booking,
          rooms: data.booking.rooms.map((room) => {
            const numberOfAdults = Number(room.numberOfAdults) || 1;
            const numberOfChildren = Number(room.numberOfChildren) || 0;
            const totalGuests = numberOfAdults + numberOfChildren;
            // Đảm bảo số lượng additionalGuests đúng với tổng khách - 1 (mainGuest)
            let guests = Array.isArray(room.additionalGuests)
              ? [...room.additionalGuests]
              : [];
            const targetLength = Math.max(0, totalGuests - 1);
            if (guests.length < targetLength) {
              for (let i = guests.length; i < targetLength; i++) {
                guests.push({
                  gender: "",
                  firstName: "",
                  lastName: "",
                  dateOfBirth: "",
                  identificationNumber: "",
                  nationality: "",
                  isChild: false,
                });
              }
            } else if (guests.length > targetLength) {
              guests = guests.slice(0, targetLength);
            }
            return {
              ...room,
              desiredRoomTypeId: room.desiredRoomTypeId?._id,
              mainGuest: room.mainGuest || {
                honorific: "",
                firstName: "",
                lastName: "",
                dateOfBirth: "",
                identificationNumber: "",
                phoneNumber: "",
                nationality: "",
              },
              additionalGuests: guests,
            };
          }),
        };
        setFormData(bookingData);
        setOriginalFormData(JSON.stringify(bookingData)); // Save as string for deep compare

        // Fetch available room types for each room in booking
        bookingData.rooms.forEach((room, index) => {
          if (room.expectedCheckInDate && room.expectedCheckOutDate) {
            fetch(
              `/api/room/available?checkInDate=${room.expectedCheckInDate}&checkOutDate=${room.expectedCheckOutDate}&excludeBookingId=${bookingId}`
            )
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  console.log(`=== Load Booking - Room ${index} ===`);
                  console.log("All rooms:", data.rooms);

                  // Count available rooms by type
                  const availableTypeCounts = {};
                  (data.rooms || []).forEach((availRoom) => {
                    console.log(`Room ${availRoom.roomNumber}:`, {
                      status: availRoom.status,
                      visibleStatus: availRoom.visibleStatus,
                      typeid: availRoom.typeid,
                    });

                    if (availRoom.visibleStatus === "available") {
                      const typeId =
                        typeof availRoom.typeid === "object" &&
                        availRoom.typeid !== null
                          ? availRoom.typeid._id || availRoom.typeid
                          : availRoom.typeid;
                      if (typeId) {
                        const typeIdStr = typeId.toString();
                        availableTypeCounts[typeIdStr] =
                          (availableTypeCounts[typeIdStr] || 0) + 1;
                        console.log(`Added type ID: ${typeId}`);
                      }
                    }
                  });

                  console.log("Available type counts:", availableTypeCounts);
                  console.log("=== End ===");

                  setAvailableRoomTypesByIndex((prev) => ({
                    ...prev,
                    [index]: availableTypeCounts,
                  }));
                }
              })
              .catch((error) => {
                console.error("Error fetching available rooms:", error);
              });
          }
        });
      })
      .catch((error) => {
        setNotification({
          isOpen: true,
          title: "Lỗi",
          message: error.message || "Không thể tải thông tin đặt phòng",
        });
      });
  }, [bookingId]);

  // Fetch rooms and room types
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
  }, []);

  // --- Handlers (reuse from BookingForm) ---
  const handleRoomChange = (index, field, value) => {
    const updatedRooms = [...formData.rooms];

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

      // Adjust additional guests array (total guests - 1 for mainGuest)
      let guests = updatedRooms[index].additionalGuests || [];
      const targetLength = Math.max(0, totalGuests - 1);

      if (guests.length < targetLength) {
        // Add new guests if needed
        for (let i = guests.length; i < targetLength; i++) {
          guests.push({
            gender: "",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
            isChild: false,
          });
        }
      } else if (guests.length > targetLength) {
        // Remove excess guests
        guests = guests.slice(0, targetLength);
      }

      updatedRooms[index].additionalGuests = guests;

      // Update pricing based on capacity and extra bed need
      if (field === "numberOfAdults") {
        const selectedTypeId = updatedRooms[index].desiredRoomTypeId;
        const selectedType = roomTypes.find((t) => t._id === selectedTypeId);
        if (selectedType) {
          const basePrice = Number(selectedType.pricePerNight);
          const capacity = Number(selectedType.capacity);
          // If adults exceed capacity, add extra bed cost
          if (numberOfAdults > capacity) {
            updatedRooms[index].pricePerNight =
              basePrice + (selectedType.extraBedPrice || 0);
            updatedRooms[index].extraBedAdded = true;
          } else {
            updatedRooms[index].pricePerNight = basePrice;
            updatedRooms[index].extraBedAdded = false;
          }
        }
      }
    } else if (field === "desiredRoomTypeId") {
      const selectedType = roomTypes.find((t) => t._id === value);
      if (selectedType) {
        const capacity = Number(selectedType.capacity);
        const numberOfAdults = updatedRooms[index].numberOfAdults || 1;

        // Set price based on whether extra bed is needed
        const basePrice = Number(selectedType.pricePerNight);
        if (numberOfAdults > capacity) {
          updatedRooms[index].pricePerNight =
            basePrice + (selectedType.extraBedPrice || 0);
          updatedRooms[index].extraBedAdded = true;
        } else {
          updatedRooms[index].pricePerNight = basePrice;
          updatedRooms[index].extraBedAdded = false;
        }

        updatedRooms[index].roomid = "";
        updatedRooms[index][field] = value;

        // Update additional guests based on current total
        const numberOfChildren = updatedRooms[index].numberOfChildren || 0;
        const totalGuests = numberOfAdults + numberOfChildren;
        const newGuests = [];
        for (let i = 0; i < Math.max(0, totalGuests - 1); i++) {
          newGuests.push({
            gender: "",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
            isChild: false,
          });
        }
        updatedRooms[index].additionalGuests = newGuests;
      }
    } else if (field === "roomid") {
      const selectedRoom = rooms.find((r) => r._id === value);
      if (selectedRoom && selectedRoom.typeid) {
        const capacity = Number(selectedRoom.typeid.capacity);
        const numberOfAdults = updatedRooms[index].numberOfAdults || 1;

        // Set price based on whether extra bed is needed
        const basePrice = Number(selectedRoom.typeid.pricePerNight);
        if (numberOfAdults > capacity) {
          updatedRooms[index].pricePerNight =
            basePrice + (selectedRoom.typeid.extraBedPrice || 0);
          updatedRooms[index].extraBedAdded = true;
        } else {
          updatedRooms[index].pricePerNight = basePrice;
          updatedRooms[index].extraBedAdded = false;
        }

        // Update additional guests based on current total
        const numberOfChildren = updatedRooms[index].numberOfChildren || 0;
        const totalGuests = numberOfAdults + numberOfChildren;
        const newGuests = [];
        for (let i = 0; i < Math.max(0, totalGuests - 1); i++) {
          newGuests.push({
            gender: "",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            identificationNumber: "",
            nationality: "",
            isChild: false,
          });
        }
        updatedRooms[index].additionalGuests = newGuests;
      }
      updatedRooms[index][field] = value;
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
    } else {
      updatedRooms[index][field] = value;

      // If date fields change, fetch available rooms to filter room types
      if (field === "expectedCheckInDate" || field === "expectedCheckOutDate") {
        const checkInDate =
          field === "expectedCheckInDate"
            ? value
            : updatedRooms[index].expectedCheckInDate;
        const checkOutDate =
          field === "expectedCheckOutDate"
            ? value
            : updatedRooms[index].expectedCheckOutDate;

        if (checkInDate && checkOutDate) {
          // Fetch all available rooms for this date range
          const excludeParam = bookingId
            ? `&excludeBookingId=${bookingId}`
            : "";
          fetch(
            `/api/room/available?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}${excludeParam}`
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                console.log("=== Available Rooms Response ===");
                console.log("All rooms:", data.rooms);

                // Count available rooms by type
                const availableTypeCounts = {};
                (data.rooms || []).forEach((room) => {
                  console.log(`Room ${room.roomNumber}:`, {
                    status: room.status,
                    visibleStatus: room.visibleStatus,
                    typeid: room.typeid,
                  });

                  if (room.visibleStatus === "available") {
                    const typeId =
                      typeof room.typeid === "object" && room.typeid !== null
                        ? room.typeid._id || room.typeid
                        : room.typeid;
                    if (typeId) {
                      const typeIdStr = typeId.toString();
                      availableTypeCounts[typeIdStr] =
                        (availableTypeCounts[typeIdStr] || 0) + 1;
                      console.log(`Added type ID: ${typeId}`);
                    }
                  }
                });

                console.log("Available type counts:", availableTypeCounts);
                console.log("=== End ===");

                setAvailableRoomTypesByIndex((prev) => ({
                  ...prev,
                  [index]: availableTypeCounts,
                }));
              }
            })
            .catch((error) => {
              console.error("Error fetching available rooms:", error);
            });
        }
      }
    }

    setFormData({ ...formData, rooms: updatedRooms });
  };

  const handleMainGuestChange = (roomIndex, e) => {
    const { name, value } = e.target;
    const updatedRooms = [...formData.rooms];

    // Auto-set gender based on honorific
    if (name === "honorific") {
      updatedRooms[roomIndex].mainGuest = {
        ...updatedRooms[roomIndex].mainGuest,
        [name]: value,
        gender: value === "Ông" ? "male" : value === "Bà" ? "female" : "",
      };
    } else {
      updatedRooms[roomIndex].mainGuest = {
        ...updatedRooms[roomIndex].mainGuest,
        [name]: value,
      };
    }

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
          pricePerNight: 0,
          expectedCheckInDate: "",
          expectedCheckInTime: "",
          expectedCheckOutDate: "",
          expectedCheckOutTime: "",
          mainGuest: {
            honorific: "",
            gender: "",
            lastName: "",
            firstName: "",
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
      if (room.numberOfChildren > 2)
        roomErrors.numberOfChildren = "Số trẻ em tối đa là 2";

      // Check if numberOfAdults exceeds room capacity
      if (room.desiredRoomTypeId && room.numberOfAdults) {
        const selectedType = roomTypes.find(
          (t) => t._id === room.desiredRoomTypeId
        );
        if (selectedType && room.numberOfAdults > selectedType.maxGuest) {
          roomErrors.numberOfAdults = `Số người lớn tối đa là ${selectedType.maxGuest}`;
        }
      }

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

  // --- Keep these handlers as in your current code ---
  const handleCheckIn = async (updatedData = formData) => {
    try {
      const response = await fetch(`/api/booking/checkin/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      setNotification({
        isOpen: true,
        title: "Thành công",
        message: "Nhận phòng thành công!",
      });
      navigate("/booking");
    } catch (error) {
      setNotification({
        isOpen: true,
        title: "Lỗi",
        message: error.message || "Không thể nhận phòng",
      });
    }
  };

  const handleCheckOut = async (selectedIndexes) => {
    try {
      // Lấy danh sách room index được chọn để trả phòng
      const selectedRoomIds = selectedIndexes.map((idx) =>
        typeof formData.rooms[idx].roomid === "object"
          ? formData.rooms[idx].roomid._id
          : formData.rooms[idx].roomid
      );

      const response = await fetch(`/api/booking/checkout/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: selectedRoomIds }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      setNotification({
        isOpen: true,
        title: "Thành công",
        message: "Trả phòng thành công!",
      });

      // Open receipt in new tab if receipt data is available
      if (data.receiptData) {
        const receiptWindow = window.open("/receipt", "_blank");
        if (receiptWindow) {
          receiptWindow.onload = () => {
            receiptWindow.postMessage(
              { type: "RECEIPT_DATA", data: data.receiptData },
              window.location.origin
            );
          };
        }
      }

      // Optionally reload or navigate
      navigate(`/booking/${bookingId}/payment`);
    } catch (error) {
      setNotification({
        isOpen: true,
        title: "Lỗi",
        message: error.message || "Không thể trả phòng",
      });
    }
  };
  const handleCancelBooking = async () => {
    try {
      const response = await fetch(`/api/booking/cancel/${bookingId}`, {
        method: "PUT",
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      setNotification({
        isOpen: true,
        title: "Thành công",
        message: "Hủy đặt phòng thành công!",
      });
      navigate("/booking");
    } catch (error) {
      setNotification({
        isOpen: true,
        title: "Lỗi",
        message: error.message || "Không thể hủy đặt phòng",
      });
    }
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
      message: "Bạn có chắc chắn muốn lưu thay đổi?",
    });
  };

  // After successful submit, update originalFormData
  const submitBooking = async () => {
    try {
      console.log("=== Submitting booking with data ===");
      console.log("FormData:", formData);
      console.log(
        "AdditionalGuests:",
        formData.rooms?.map((r) => r.additionalGuests)
      );

      const url = bookingId
        ? `/api/booking/update/${bookingId}`
        : "/api/booking";
      const method = bookingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      setNotification({
        isOpen: true,
        title: "Thành công",
        message: bookingId
          ? "Cập nhật đặt phòng thành công!"
          : "Tạo đặt phòng thành công!",
      });

      if (!bookingId) {
        // Navigate to the new booking's detail page
        navigate(`/booking/${data.booking._id}`);
      } else {
        setOriginalFormData(JSON.stringify(formData)); // Update original after save
      }
    } catch (error) {
      setNotification({
        isOpen: true,
        title: "Lỗi",
        message: error.message,
      });
    }
  };

  // Check if formData is different from originalFormData
  const isFormChanged =
    originalFormData && JSON.stringify(formData) !== originalFormData;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold mb-6">
          {bookingId ? "Thông tin khách đặt phòng" : "Đặt phòng mới"}
        </h1>

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Thông tin khách hàng</h2>
          {(propCustomerId || formData.customerid) && (
            <button
              type="button"
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 cursor-pointer transition"
              onClick={() =>
                navigate(
                  `/customer/${propCustomerId || formData.customerid._id}`
                )
              }
            >
              Xem thông tin khách hàng
            </button>
          )}
        </div>

        <div className=" flex gap-10">
          <p className="mb-4">
            Danh xưng:{" "}
            {customerData?.honorific ||
              formData.customerid?.honorific ||
              formData.customerSnapshot?.honorific ||
              ""}
          </p>
          <p className="mb-4">
            Họ:{" "}
            {customerData?.lastName ||
              formData.customerid?.lastName ||
              formData.customerSnapshot?.lastName ||
              ""}
          </p>
          <p className="mb-4">
            Tên:{" "}
            {customerData?.firstName ||
              formData.customerid?.firstName ||
              formData.customerSnapshot?.firstName ||
              ""}
          </p>
        </div>
        <p className="mb-4">
          Số điện thoại:{" "}
          {customerData?.phoneNumber ||
            formData.customerid?.phoneNumber ||
            formData.customerSnapshot?.phoneNumber ||
            ""}
        </p>
        <p className="mb-4">
          Email:{" "}
          {customerData?.email ||
            formData.customerid?.email ||
            formData.customerSnapshot?.email ||
            ""}
        </p>
        <div className="mb-4">
          CMND/CDDD/Passport:{" "}
          {customerData?.identificationNumber ||
            formData.customerid?.identificationNumber ||
            formData.customerSnapshot?.identificationNumber ||
            ""}
        </div>
      </div>
      <div className="mb-2 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Thông tin đặt phòng</h2>
        {bookingId && (
          <button
            type="button"
            className={`px-3 py-1 rounded transition ${
              !customerData?.identificationNumber &&
              !formData.customerid?.identificationNumber &&
              !formData.customerSnapshot?.identificationNumber
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
            }`}
            onClick={() => {
              if (
                customerData?.identificationNumber ||
                formData.customerid?.identificationNumber ||
                formData.customerSnapshot?.identificationNumber
              ) {
                navigate(`/booking/${bookingId}/services`);
              }
            }}
            disabled={
              !customerData?.identificationNumber &&
              !formData.customerid?.identificationNumber &&
              !formData.customerSnapshot?.identificationNumber
            }
          >
            Dịch vụ
          </button>
        )}
      </div>
      {bookingId && (
        <div className="py-4 font-bold ">
          Mã đặt phòng : {formData.bookingCode}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {formData.rooms.map((room, index) => (
          <div key={index} className="p-4 border rounded-md shadow-md">
            <div className="md:grid md:grid-cols-2 md:gap-6">
              <div>
                <BookingInput
                  formData={room}
                  formErrors={formErrors[index] || {}}
                  onChange={(e) =>
                    handleRoomChange(index, e.target.name, e.target.value)
                  }
                  rooms={rooms}
                  availableRoomTypeCounts={availableRoomTypesByIndex[index]}
                  allRoomsInBooking={formData.rooms}
                  currentRoomIndex={index}
                  roomTypes={roomTypes}
                  checkInNow={
                    formData.status === "checked_in" ||
                    formData.status === "completed"
                  }
                  disabled={
                    formData.status === "completed" ||
                    formData.status === "cancelled" ||
                    (!customerData?.identificationNumber &&
                      !formData.customerid?.identificationNumber &&
                      !formData.customerSnapshot?.identificationNumber)
                  }
                />
              </div>
              <div>
                <MainGuestInput
                  mainGuest={room.mainGuest}
                  onChange={(e) => handleMainGuestChange(index, e)}
                  formErrors={formErrors[index]?.mainGuest || {}}
                  disabled={
                    formData.status === "completed" ||
                    formData.status === "cancelled" ||
                    (!customerData?.identificationNumber &&
                      !formData.customerid?.identificationNumber &&
                      !formData.customerSnapshot?.identificationNumber)
                  }
                />
              </div>
            </div>

            {/* Additional Guests - Full width below the main grid */}
            <div className="mt-6">
              <AdditionalGuestsInput
                guests={room.additionalGuests}
                numberOfAdults={room.numberOfAdults}
                numberOfChildren={room.numberOfChildren}
                onChange={(guestIndex, field, value) =>
                  handleGuestChange(index, guestIndex, field, value)
                }
                disabled={
                  formData.status === "completed" ||
                  formData.status === "cancelled" ||
                  (!customerData?.identificationNumber &&
                    !formData.customerid?.identificationNumber &&
                    !formData.customerSnapshot?.identificationNumber)
                }
                formErrors={formErrors[index]?.additionalGuests || {}}
              />
            </div>

            {/* Chỉ cho phép xóa phòng khi trạng thái là "booked" và có identificationNumber */}
            {formData.rooms.length > 1 &&
              formData.status === "booked" &&
              (customerData?.identificationNumber ||
                formData.customerid?.identificationNumber ||
                formData.customerSnapshot?.identificationNumber) && (
                <button
                  type="button"
                  onClick={() => handleRemoveRoom(index)}
                  className="bg-red-500 text-white px-3 mt-3 py-1 rounded hover:bg-red-600 cursor-pointer transition"
                >
                  Xoá phòng này
                </button>
              )}
          </div>
        ))}

        {/* Chỉ cho phép thêm phòng khi trạng thái là "booked" và có identificationNumber */}
        {formData.status === "booked" &&
          (customerData?.identificationNumber ||
            formData.customerid?.identificationNumber ||
            formData.customerSnapshot?.identificationNumber) && (
            <button
              type="button"
              onClick={handleAddRoom}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer transition"
            >
              + Thêm phòng
            </button>
          )}

        {/* --- Keep the four last buttons and their logic as-is --- */}
        <div className="pt-4">
          <button
            disabled={
              bookingId &&
              (formData.status === "cancelled" ||
                formData.status === "completed")
            }
            type="submit"
            className={`w-full md:w-auto bg-blue-600 cursor-pointer text-white font-medium py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition duration-300
              ${
                bookingId &&
                (formData.status === "cancelled" ||
                  formData.status === "completed")
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
          >
            {bookingId ? "Áp dụng" : "Tạo đặt phòng"}
          </button>

          {bookingId && formData.status === "booked" && (
            <button
              type="button"
              onClick={() => setCheckInModal(true)}
              disabled={
                isFormChanged ||
                (!customerData?.identificationNumber &&
                  !formData.customerid?.identificationNumber &&
                  !formData.customerSnapshot?.identificationNumber)
              }
              className={`w-full md:w-auto bg-blue-600 ms-3 cursor-pointer text-white font-medium py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition duration-300
                ${
                  isFormChanged ||
                  (!customerData?.identificationNumber &&
                    !formData.customerid?.identificationNumber &&
                    !formData.customerSnapshot?.identificationNumber)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
              title={
                isFormChanged
                  ? "Vui lòng lưu thay đổi trước khi nhận phòng"
                  : !customerData?.identificationNumber &&
                    !formData.customerid?.identificationNumber &&
                    !formData.customerSnapshot?.identificationNumber
                  ? "Cần có số CMND/CCCD để nhận phòng"
                  : ""
              }
            >
              Nhận phòng
            </button>
          )}
          {bookingId && formData.status === "checked_in" && (
            <button
              type="button"
              onClick={() =>
                setCheckOutConfirmModal({
                  isOpen: true,
                  message: "Bạn có chắc chắn muốn trả phòng?",
                })
              }
              disabled={
                !customerData?.identificationNumber &&
                !formData.customerid?.identificationNumber &&
                !formData.customerSnapshot?.identificationNumber
              }
              className={`w-full md:w-auto bg-blue-600 ms-3 cursor-pointer text-white font-medium py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition duration-300
                ${
                  !customerData?.identificationNumber &&
                  !formData.customerid?.identificationNumber &&
                  !formData.customerSnapshot?.identificationNumber
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
            >
              Trả phòng
            </button>
          )}

          {bookingId && (
            <button
              disabled={
                formData.status === "cancelled" ||
                formData.status === "completed" ||
                (!customerData?.identificationNumber &&
                  !formData.customerid?.identificationNumber &&
                  !formData.customerSnapshot?.identificationNumber)
              }
              type="button"
              onClick={() =>
                setCancelConfirmModal({
                  isOpen: true,
                  message: "Bạn có chắc muốn hủy đặt phòng này?",
                })
              }
              className={`w-full md:w-auto bg-red-600 ms-3 cursor-pointer text-white font-medium py-3 px-6 rounded-lg shadow hover:bg-red-700 transition duration-300
    ${
      formData.status === "cancelled" ||
      formData.status === "completed" ||
      (!customerData?.identificationNumber &&
        !formData.customerid?.identificationNumber &&
        !formData.customerSnapshot?.identificationNumber)
        ? "opacity-50 cursor-not-allowed"
        : ""
    }`}
            >
              Hủy đặt phòng
            </button>
          )}

          {bookingId && (
            <button
              type="button"
              onClick={() => {
                if (
                  customerData?.identificationNumber ||
                  formData.customerid?.identificationNumber ||
                  formData.customerSnapshot?.identificationNumber
                ) {
                  navigate(`/booking/${bookingId}/payment`);
                }
              }}
              disabled={
                !customerData?.identificationNumber &&
                !formData.customerid?.identificationNumber &&
                !formData.customerSnapshot?.identificationNumber
              }
              className={`w-full md:w-auto ms-3 cursor-pointer text-white font-medium py-3 px-6 rounded-lg shadow transition duration-300 ${
                !customerData?.identificationNumber &&
                !formData.customerid?.identificationNumber &&
                !formData.customerSnapshot?.identificationNumber
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Xem thanh toán
            </button>
          )}
        </div>
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
      <CheckInModal
        isOpen={checkInModal}
        onClose={() => setCheckInModal(false)}
        // Truyền mảng desiredRoomTypeId cho từng phòng
        typeId={formData.rooms.map((r) => r.desiredRoomTypeId)}
        roomsToCheckIn={formData.rooms.length}
        onSelectRoom={(selectedRoomIds) => {
          setFormData((prev) => {
            const updatedRooms = prev.rooms.map((room, idx) => ({
              ...room,
              roomid: selectedRoomIds[idx],
            }));
            handleCheckIn({ ...prev, rooms: updatedRooms });
            return { ...prev, rooms: updatedRooms };
          });
        }}
      />
      <ConfirmModal
        isOpen={cancelConfirmModal.isOpen}
        message={cancelConfirmModal.message}
        onCancel={() =>
          setCancelConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={() => {
          setCancelConfirmModal((prev) => ({ ...prev, isOpen: false }));
          handleCancelBooking();
        }}
      />
      <CheckOutModal
        isOpen={checkOutConfirmModal.isOpen}
        rooms={formData.rooms}
        onClose={() =>
          setCheckOutConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={(selectedIndexes) => {
          // Gọi API trả phòng cho các phòng có index trong selectedIndexes
          handleCheckOut(selectedIndexes);
          setCheckOutConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </>
  );
}
