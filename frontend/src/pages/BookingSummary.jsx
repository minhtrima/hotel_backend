import { useState } from "react";

import NotificationModal from "../components/NotificationModal";
import { useEffect } from "react";

export default function BookingSummary() {
  const [bookings, setBookings] = useState([]);
  const [types, setTypes] = useState([]);

  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const fetchBookingData = async () => {
    const response = await fetch("/api/booking");
    const data = await response.json();
    if (!response.ok || !data.success) {
      setNotification({
        isOpen: true,
        title: "Lỗi",
        message: data.message || "Có lỗi xảy ra khi lấy thông tin đặt phòng",
      });
      throw new Error(
        data.message || "Có lỗi xảy ra khi lấy thông tin đặt phòng"
      );
    }
  };

  const fetchRoomDatas = async () => {
    const response = await fetch("/api/room");
    if (!response.ok) throw new Error("Failed to fetch room data");

    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch room data");

    return data.rooms.map((room) => ({
      id: room._id,
      roomNumber: room.roomNumber,
      type: room.typeid?.name,
      typeId: room.typeid?._id,
      floor: room.floor,
      status: room.status,
      pricePerNight: room.typeid?.pricePerNight,
      capacity: room.typeid?.capacity,
    }));
  };

  const fetchTypeData = async () => {
    const response = await fetch("/api/type");
    if (!response.ok) throw new Error("Failed to fetch room type data");
    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch room type data");
    return data.types.map((type) => ({
      id: type._id,
      name: type.name,
      pricePerNight: type.pricePerNight,
      capacity: type.capacity,
    }));
  };

  useEffect(() => {
    fetchBookingData()
      .then((data) => {
        setBookings(data);
      })
      .catch((error) => {
        console.error("Failed to load room types:", error);
        setNotification({
          isOpen: true,
          title: "Lỗi",
          message: "Không thể tải dữ liệu đặt phòng",
        });
      });

    fetchTypeData()
      .then((data) => {
        setTypes(data);
      })
      .catch((error) => {
        console.error("Failed to load room types:", error);
        setNotification({
          isOpen: true,
          title: "Lỗi",
          message: "Không thể tải dữ liệu loại phòng",
        });
      });
  }, []);

  return (
    <>
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
    </>
  );
}
