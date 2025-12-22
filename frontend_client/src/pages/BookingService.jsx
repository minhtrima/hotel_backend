import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import BookingSidebar from "../components/BookingSidebar";
import Header from "../components/Header";

const fetchBookingData = async (bookingId) => {
  const response = await fetch(`/api/booking/${bookingId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch booking data");
  }
  const data = await response.json();
  return data.booking;
};

const fetchService = async () => {
  const response = await fetch("/api/service/non-room");
  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }
  const data = await response.json();
  return data.service;
};

export default function BookingService() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [services, setServices] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookingData(bookingId)
      .then((booking) => {
        setBooking(booking);
        console.log("Booking data:", booking);

        // Initialize selectedServices based on booking.services
        const initialServices = (booking.services || []).map((service) => {
          // Handle case where serviceId is an object (full service data)
          if (typeof service.serviceId === "object" && service.serviceId._id) {
            return {
              serviceId: service.serviceId._id,
              quantity: service.quantity || 1,
              price: service.price || service.serviceId.price,
            };
          }
          // Handle case where serviceId is just a string ID
          return {
            serviceId: service.serviceId,
            quantity: service.quantity || 1,
            price: service.price,
          };
        });
        console.log("Initial selected services:", initialServices);
        setSelectedServices(initialServices);
      })
      .catch((error) => {
        console.error("Error fetching booking data:", error);
      });

    fetchService()
      .then((service) => {
        setServices(service);
        console.log("Transportation services:", service);
      })
      .catch((error) => {
        console.error("Error fetching service data:", error);
      });
  }, [bookingId]);

  const handleServiceChange = (serviceId, isChecked) => {
    setSelectedServices((prev) => {
      if (isChecked) {
        // Add service if not already selected
        const exists = prev.some((service) => {
          const selectedServiceId =
            typeof service.serviceId === "object"
              ? service.serviceId._id
              : service.serviceId;
          return selectedServiceId === serviceId;
        });
        if (!exists) {
          // Find the service to get its price
          const service = services?.find((s) => s._id === serviceId);
          return [
            ...prev,
            {
              serviceId,
              quantity: 1,
              price: service?.price || 0,
            },
          ];
        }
        return prev;
      } else {
        // Remove service
        return prev.filter((service) => {
          const selectedServiceId =
            typeof service.serviceId === "object"
              ? service.serviceId._id
              : service.serviceId;
          return selectedServiceId !== serviceId;
        });
      }
    });
  };

  const handleQuantityChange = (serviceId, newQuantity) => {
    if (newQuantity < 1) return;

    setSelectedServices((prev) => {
      return prev.map((service) => {
        // Handle both string IDs and object IDs
        const selectedServiceId =
          typeof service.serviceId === "object"
            ? service.serviceId._id
            : service.serviceId;
        return selectedServiceId === serviceId
          ? { ...service, quantity: parseInt(newQuantity) }
          : service;
      });
    });
  };

  const isServiceSelected = (serviceId) => {
    return selectedServices.some((service) => {
      // Handle both string IDs and object IDs
      const selectedServiceId =
        typeof service.serviceId === "object"
          ? service.serviceId._id
          : service.serviceId;
      return selectedServiceId === serviceId;
    });
  };

  const getServiceQuantity = (serviceId) => {
    const service = selectedServices.find((service) => {
      // Handle both string IDs and object IDs
      const selectedServiceId =
        typeof service.serviceId === "object"
          ? service.serviceId._id
          : service.serviceId;
      return selectedServiceId === serviceId;
    });
    return service ? service.quantity : 1;
  };
  const getTotalPrice = () => {
    return selectedServices.reduce((total, selectedService) => {
      // Handle both string IDs and object IDs
      const selectedServiceId =
        typeof selectedService.serviceId === "object"
          ? selectedService.serviceId._id
          : selectedService.serviceId;

      const service = services?.find((s) => s._id === selectedServiceId);
      if (service) {
        return total + service.price * selectedService.quantity;
      }
      // Fallback to use price from selectedService if service not found in services array
      if (selectedService.price) {
        return total + selectedService.price * selectedService.quantity;
      }
      return total;
    }, 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  // Add this effect to log changes to selectedServices
  useEffect(() => {
    if (selectedServices.length > 0) {
      console.log("Current selectedServices:", selectedServices);
    }
  }, [selectedServices]);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/booking/add-service/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          services: selectedServices.map((service) => {
            // Handle both string IDs and object IDs
            const serviceId =
              typeof service.serviceId === "object"
                ? service.serviceId._id
                : service.serviceId;
            return {
              serviceId: serviceId,
              quantity: service.quantity,
            };
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit services");
      }

      const data = await response.json();
      console.log("Transportation services saved successfully:", data);
      alert("Dịch vụ vận chuyển đã được cập nhật thành công!");
      const updatedBooking = await fetchBookingData(bookingId);
      navigate(`/booking-checkout/${updatedBooking.bookingCode}`);
    } catch (error) {
      alert("Lỗi khi cập nhật dịch vụ: " + error.message);
      console.error("Error submitting services:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Main content */}
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <div className=" p-6 rounded max-w-4xl mx-auto">
            <h1 className="text-3xl font-semibold">Dịch vụ bổ sung</h1>
            {services ? (
              <div className="mt-4 gap-6">
                {services.map((service) => (
                  <div
                    key={service._id}
                    className="mb-4 flex p-4 rounded bg-white shadow-lg"
                  >
                    {/* Service Image */}
                    <div className="w-60 h-40 flex-shrink-0">
                      {service.images?.[0]?.url ? (
                        <img
                          src={service.images[0].url}
                          alt={service.images[0].alt || service.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="ml-6 flex-1">
                      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                        {service.name}
                      </h2>
                      <p className="text-gray-600 mb-4">
                        {service.description}
                      </p>

                      {/* Service Selection */}
                      <div className="flex items-center mb-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isServiceSelected(service._id)}
                            onChange={(e) =>
                              handleServiceChange(service._id, e.target.checked)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-lg">Chọn dịch vụ này</span>
                        </label>
                      </div>

                      {/* Quantity Control */}
                      {isServiceSelected(service._id) && (
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-700">Số lượng:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                              disabled={getServiceQuantity(service._id) <= 1}
                              onClick={() =>
                                handleQuantityChange(
                                  service._id,
                                  getServiceQuantity(service._id) - 1
                                )
                              }
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-medium">
                              {getServiceQuantity(service._id)}
                            </span>
                            <button
                              type="button"
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                              onClick={() =>
                                handleQuantityChange(
                                  service._id,
                                  getServiceQuantity(service._id) + 1
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price Info */}
                    <div className="ml-6 text-right">
                      <div className="text-3xl font-bold text-gray-800 mb-2">
                        {formatPrice(service.price)}
                      </div>
                      <div className="text-gray-600">
                        /{service.unitDisplay}
                      </div>

                      {isServiceSelected(service._id) && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="text-lg font-semibold text-green-600">
                            Tổng:{" "}
                            {formatPrice(
                              service.price * getServiceQuantity(service._id)
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Total Summary */}
                {selectedServices.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold text-gray-700">
                        Tổng tiền dịch vụ:
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading services...</p>
            )}{" "}
            <button
              type="button"
              className="mt-4 bg-blue-500 text-white rounded px-4 py-2 cursor-pointer hover:bg-blue-700"
              onClick={handleSubmit}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <BookingSidebar booking={booking} />
    </div>
  );
}
