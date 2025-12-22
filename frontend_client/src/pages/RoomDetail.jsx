import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ImageModal from "../components/ImageModal";

const amenityLabels = {
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
};

export default function RoomDetail() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [roomType, setRoomType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  useEffect(() => {
    const fetchRoomType = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/type/name/${encodeURIComponent(roomName)}`
        );
        const data = await response.json();

        if (data.success) {
          setRoomType(data.type);
        } else {
          console.error("Failed to fetch room type:", data.message);
        }
      } catch (error) {
        console.error("Error fetching room type:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomType();
  }, [roomName, navigate]);

  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handleImageClick = () => {
    setModalImageIndex(selectedImageIndex);
    setShowImageModal(true);
  };

  const handlePrevImage = () => {
    setModalImageIndex((prev) =>
      prev === 0 ? roomType.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setModalImageIndex((prev) =>
      prev === roomType.images.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!roomType) {
    return null;
  }

  const images = roomType.images || [];
  const selectedImage = images[selectedImageIndex] || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <button
            onClick={() => navigate("/rooms")}
            className="hover:text-blue-600"
          >
            Phòng
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{roomType.name}</span>
        </div>

        {/* Main Image Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {images.length > 0 ? (
            <>
              {/* Large Image */}
              <div
                className="relative w-full h-96 cursor-pointer"
                onClick={handleImageClick}
              >
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt || roomType.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail Slider */}
              {images.length > 1 && (
                <div className="p-4 bg-gray-100">
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`flex-shrink-0 cursor-pointer transition-all ${
                          selectedImageIndex === index
                            ? "ring-2 ring-blue-500"
                            : "opacity-70 hover:opacity-100"
                        }`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <img
                          src={image.url}
                          alt={image.alt || `${roomType.name} ${index + 1}`}
                          className="w-24 h-24 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-lg">Không có hình ảnh</span>
            </div>
          )}
        </div>

        {/* Room Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Phòng {roomType.name}
          </h1>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Thông tin chung
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>
                  <span className="font-medium">Sức chứa:</span>{" "}
                  {roomType.capacity} người
                </p>
                {roomType.extraBedAllowed && (
                  <p>
                    <span className="font-medium">Số khách tối đa:</span>{" "}
                    {roomType.maxGuest} người (có giường phụ)
                  </p>
                )}
                <p>
                  <span className="font-medium">Giá mỗi đêm:</span>{" "}
                  <span className="text-2xl font-bold text-blue-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(roomType.pricePerNight)}
                  </span>
                </p>
                {roomType.extraBedAllowed && roomType.extraBedPrice > 0 && (
                  <p>
                    <span className="font-medium">Giá giường phụ:</span>{" "}
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(roomType.extraBedPrice)}
                    /đêm
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Mô tả
              </h3>
              <p className="text-gray-600 text-justify leading-relaxed">
                {roomType.description || "Không có mô tả"}
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-bold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Đặt phòng ngay
            </button>
          </div>
        </div>

        {/* Amenities Section */}
        {roomType.amenities && roomType.amenities.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Tiện ích
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomType.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-3xl mr-4">{"✓"}</span>
                  <span className="text-gray-800 font-medium">
                    {amenityLabels[amenity] || amenity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={images}
        currentIndex={modalImageIndex}
        onNavigate={(direction) => {
          if (direction === "prev") handlePrevImage();
          else handleNextImage();
        }}
        title={roomType.name}
      />
    </div>
  );
}
