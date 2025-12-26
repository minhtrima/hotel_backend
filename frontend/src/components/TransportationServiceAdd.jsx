import React, { useEffect, useState } from "react";

export default function TransportationServiceAdd({ isOpen, onClose, onAdd }) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");

  const fetchServiceDatas = async () => {
    const response = await fetch("/api/service");
    if (!response.ok) throw new Error("Failed to fetch services data");
    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch services data");

    // Filter services to only include those with forEachRoom = false (transportation/general services)
    const transportationServices = data.services.filter(
      (service) => service.forEachRoom === false
    );
    return transportationServices;
  };

  useEffect(() => {
    if (isOpen) {
      fetchServiceDatas()
        .then((data) => {
          setServices(data);
        })
        .catch((err) => {
          console.error("Failed to load services:", err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black opacity-10 z-[1000] pointer-events-auto"
        onClick={onClose}
      ></div>
      <div
        className="relative bg-white p-6 rounded shadow-2xl max-w-md w-full z-[1101]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">
            Thêm dịch vụ vận chuyển/tổng hợp
          </h1>
          <button
            type="button"
            className="text-2xl text-gray-500 hover:text-red-600 cursor-pointer"
            onClick={onClose}
            title="Đóng"
          >
            ×
          </button>
        </div>
        <select
          className="w-full border rounded p-2 mb-4 cursor-pointer"
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
        >
          <option value="">Chọn dịch vụ</option>
          {services.map((service) => (
            <option
              key={service._id || service.id}
              value={service._id || service.id}
            >
              {service.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
          disabled={!selectedService}
          onClick={() => {
            onAdd(selectedService);
            onClose();
          }}
        >
          Thêm dịch vụ
        </button>
      </div>
    </div>
  );
}
