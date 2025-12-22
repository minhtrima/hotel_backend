import React, { useEffect, useState } from "react";

const ServiceCard = ({ service }) => {
  return (
    <div
      key={service._id}
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-blue-600">
            {service.price?.toLocaleString("vi-VN")}đ
            {service.unitDisplay && (
              <span className="text-sm text-gray-500">
                /{service.unitDisplay}
              </span>
            )}
          </span>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          {service.category && (
            <div>
              <span className="font-medium">Loại:</span>{" "}
              {service.category === "per_unit"
                ? "Theo suất"
                : service.category === "transportation"
                ? "Vận chuyển"
                : service.category}
            </div>
          )}
          {service.forEachRoom !== undefined && (
            <div>
              <span className="font-medium">Áp dụng:</span>{" "}
              {service.forEachRoom ? "Theo phòng" : "Theo booking"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServicesData = async () => {
    try {
      const response = await fetch("/api/service");
      if (!response.ok) throw new Error("Failed to fetch services data");

      const data = await response.json();
      if (!data.success) throw new Error("Failed to fetch services data");

      // Extract primary image for each service
      const servicesWithImages = data.services.map((service) => ({
        ...service,
        image:
          service.images && service.images.length > 0
            ? service.images.find((img) => img.isPrimary)?.url ||
              service.images[0].url
            : null,
      }));

      return servicesWithImages;
    } catch (error) {
      console.error("Error fetching services data:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchServicesData().then((services) => {
      setServices(services);
      console.log("All services:", services);
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
            Dịch Vụ Của Chúng Tôi
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá các dịch vụ chất lượng cao được thiết kế để mang đến sự
            thoải mái và tiện ích tối đa cho kỳ nghỉ của bạn
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Hiện tại chưa có dịch vụ nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
