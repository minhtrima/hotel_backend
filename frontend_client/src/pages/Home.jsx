import React, { useState, useEffect } from "react";
import ImageModal from "../components/ImageModal";

export default function Home() {
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction) => {
    const currentIndex = galleryImages.findIndex(
      (img) => img._id === selectedImage._id
    );
    let newIndex;

    if (direction === "next") {
      newIndex =
        currentIndex + 1 >= galleryImages.length ? 0 : currentIndex + 1;
    } else {
      newIndex =
        currentIndex - 1 < 0 ? galleryImages.length - 1 : currentIndex - 1;
    }

    setSelectedImage(galleryImages[newIndex]);
  };

  useEffect(() => {
    fetchGalleryImages();
    fetchRoomTypes();
    fetchServices();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch("/api/images/category/gallery");
      const data = await response.json();
      console.log("Fetched gallery images:", data);

      if (data.success && data.data.length > 0) {
        // Sort by position and get first 4 images
        const sortedImages = data.data
          .sort((a, b) => a.position - b.position)
          .slice(0, 4);
        setGalleryImages(sortedImages);
      }
    } catch (error) {
      console.error("Error fetching gallery images:", error);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch("/api/type");
      const data = await response.json();
      console.log("Fetched room types:", data);

      if (
        data.success &&
        data.types &&
        Array.isArray(data.types) &&
        data.types.length > 0
      ) {
        console.log(data.types);
        // Get first 3 room types and extract primary image
        const roomTypesWithImages = data.types.slice(0, 3).map((room) => ({
          ...room,
          price: room.pricePerNight,
          image:
            room.images && room.images.length > 0
              ? room.images.find((img) => img.isPrimary)?.url ||
                room.images[0].url
              : null,
        }));
        setRoomTypes(roomTypesWithImages);
      } else {
        console.log("No room types found or invalid data structure");
        setRoomTypes([]);
      }
    } catch (error) {
      console.error("Error fetching room types:", error);
      setRoomTypes([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/service");
      const data = await response.json();
      console.log("Fetched services:", data);

      if (
        data.success &&
        data.services &&
        Array.isArray(data.services) &&
        data.services.length > 0
      ) {
        // Get first 3 services and extract primary image
        const servicesWithImages = data.services.slice(0, 3).map((service) => ({
          ...service,
          image:
            service.images && service.images.length > 0
              ? service.images.find((img) => img.isPrimary)?.url ||
                service.images[0].url
              : null,
        }));
        setServices(servicesWithImages);
      } else {
        console.log("No services found or invalid data structure");
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Chào mừng đến với HaiAuHotel
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🏨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Phòng Sang Trọng</h3>
              <p className="text-gray-600">
                Các phòng được thiết kế hiện đại với đầy đủ tiện nghi cao cấp
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🍽️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ẩm Thực Tuyệt Hạo</h3>
              <p className="text-gray-600">
                Thưởng thức các món ăn ngon từ đầu bếp chuyên nghiệp
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🏊‍♀️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tiện Ích Đẳng Cấp</h3>
              <p className="text-gray-600">
                Hồ bơi, spa, gym và nhiều dịch vụ giải trí hấp dẫn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Preview Section */}
      <div className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Thư Viện Ảnh
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Khám phá những khoảnh khắc đẹp nhất tại HaiAuHotel qua bộ sưu tập
              ảnh của chúng tôi
            </p>
          </div>

          {galleryLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {galleryImages.map((image) => (
                  <div
                    key={image._id}
                    className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => openImageModal(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || image.title}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg
                          className="w-8 h-8 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <a
                  href="/gallery"
                  className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105"
                >
                  Xem Tất Cả Ảnh
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Room Types Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loại Phòng
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Khám phá các loại phòng đa dạng với thiết kế hiện đại và tiện nghi
              cao cấp
            </p>
          </div>

          {roomsLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {roomTypes.map((room) => (
                  <div
                    key={room._id}
                    className="bg-white rounded-lg shadow-md cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() =>
                      (window.location.href = `/room/${room.name}`)
                    }
                  >
                    <div className="relative h-64 group">
                      <img
                        src={room.image || "/placeholder-room.jpg"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {room.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {room.description ||
                          "Phòng được thiết kế sang trọng với đầy đủ tiện nghi hiện đại."}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {room.price?.toLocaleString("vi-VN")}đ
                          <span className="text-sm text-gray-500">/đêm</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <a
                  href="/rooms"
                  className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105"
                >
                  Xem Tất Cả Phòng
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Dịch Vụ</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trải nghiệm các dịch vụ chất lượng cao được thiết kế để mang đến
              sự thoải mái tối đa
            </p>
          </div>

          {servicesLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {services.map((service) => (
                  <div
                    key={service._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="relative h-64">
                      <img
                        src={service.image || "/placeholder-service.jpg"}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {service.description ||
                          "Dịch vụ chất lượng cao với đội ngũ chuyên nghiệp."}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {service.price?.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <a
                  href="/services"
                  className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105"
                >
                  Xem Tất Cả Dịch Vụ
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Modal for Gallery Preview */}
      <ImageModal
        isOpen={!!selectedImage}
        onClose={closeImageModal}
        images={galleryImages}
        currentIndex={galleryImages.findIndex(
          (img) => img._id === selectedImage?._id
        )}
        onNavigate={(direction) => navigateImage(direction)}
        title="Gallery"
      />
    </div>
  );
}
