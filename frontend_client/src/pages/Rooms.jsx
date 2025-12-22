import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const RoomCard = ({ room }) => {
  const navigate = useNavigate();

  // Extract primary image
  const primaryImage =
    room.images && room.images.length > 0
      ? room.images.find((img) => img.isPrimary)?.url || room.images[0].url
      : "/placeholder-room.jpg";

  return (
    <div
      key={room._id}
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
    >
      <div className="relative h-64">
        <img
          src={primaryImage}
          alt={room.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Phòng {room.name}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {room.description ||
            "Phòng được thiết kế sang trọng với đầy đủ tiện nghi hiện đại."}
        </p>
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-blue-600">
            {room.pricePerNight?.toLocaleString("vi-VN")}đ
            <span className="text-sm text-gray-500">/đêm</span>
          </span>
        </div>
        <div className="text-sm text-gray-500 space-y-1 mb-4">
          <div>
            <span className="font-medium">Sức chứa:</span> {room.capacity} người
          </div>
          <div>
            <span className="font-medium">Tối đa:</span> {room.maxGuest} khách
          </div>
          {room.extraBedAllowed && (
            <div>
              <span className="font-medium">Giường phụ:</span> +
              {room.extraBedPrice?.toLocaleString("vi-VN")}đ
            </div>
          )}
        </div>
        <button
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
          onClick={() => navigate(`/rooms/${room.name}`)}
        >
          XEM CHI TIẾT
        </button>
      </div>
    </div>
  );
};

export default function Rooms() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoomTypeData = async () => {
    try {
      const response = await fetch("/api/type");
      if (!response.ok) throw new Error("Failed to fetch room data");

      const data = await response.json();
      if (!data.success) throw new Error("Failed to fetch room data");

      return data.types;
    } catch (error) {
      console.error("Error fetching room data:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchRoomTypeData().then((rooms) => {
      setRoomTypes(rooms);
      console.log(rooms);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <hr className="border-gray-300 mb-10" />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Loại Phòng Của Chúng Tôi
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá các loại phòng đa dạng với thiết kế hiện đại và tiện nghi
            cao cấp để mang đến trải nghiệm nghỉ dưỡng tuyệt vời
          </p>
        </div>

        {roomTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Hiện tại chưa có loại phòng nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomTypes.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
