import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BackArrow from "../components/BackArrow";
import NotificationModal from "../components/NotificationModal";
import ConfirmModal from "../components/ConfirmModal";
import ServicesForBookingAdd from "../components/ServicesForBookingAdd";
import ServicesForBookingDetail from "../components/ServicesForBookingDetail";
import TransportationServiceAdd from "../components/TransportationServiceAdd";

export default function ServiceForBooking() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState({});
  const [openShowNotify, setOpenShowNotify] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyTitle, setNotifyTitle] = useState("Thông báo");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState(
    "Bạn có chắc chắn muốn thực hiện thao tác này?"
  );
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showTransportationModal, setShowTransportationModal] = useState(false);
  const [roomServices, setRoomServices] = useState([]);
  const [transportationServices, setTransportationServices] = useState([]);
  const [index, setIndex] = useState(null);

  const fetchBookingData = async () => {
    const response = await fetch("/api/booking/" + bookingId);
    if (!response.ok) throw new Error("Failed to fetch booking data");
    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch booking data");
    return data.booking; // trả về booking object đầy đủ
  };

  const showNotify = (title = "Thông báo", msg = "") => {
    setNotifyTitle(title);
    setNotifyMsg(msg);
    setOpenShowNotify(true);
  };

  useEffect(() => {
    if (!bookingId) {
      showNotify("Lỗi", "Không có ID đặt phòng!");
      navigate("/booking");
      return;
    }
    fetchBookingData()
      .then((bookingData) => {
        setBooking(bookingData);

        // Set transportation/general booking services (forEachRoom == false)
        setTransportationServices(
          (bookingData.services || []).map((service) => ({
            ...service.serviceId, // name, price, unit, ...
            quantity: service.quantity,
            _id: service.serviceId?._id || service._id, // đảm bảo có _id
          }))
        );

        // Set room services (forEachRoom == true)
        setRoomServices(
          (bookingData.rooms || []).map((room) =>
            room.additionalServices
              ? room.additionalServices.map((service) => ({
                  ...service.serviceId, // name, price, unit, ...
                  quantity: service.quantity,
                  _id: service.serviceId?._id || service._id, // đảm bảo có _id
                }))
              : []
          )
        );
      })
      .catch((err) => {
        showNotify("Lỗi", "Không thể tải dữ liệu đặt phòng!");
        console.error("Failed to load booking:", err);
      });
  }, [bookingId]);

  // Sửa addService để cập nhật roomServices
  const addService = (serviceId, roomIndex) => {
    if (!serviceId) {
      showNotify("Thông báo", "Vui lòng chọn dịch vụ để thêm!");
      return;
    }

    // Giả sử bạn có thể lấy thông tin dịch vụ từ API hoặc truyền vào từ ServicesForBookingAdd
    fetch("/api/service/" + serviceId)
      .then((res) => res.json())
      .then((data) => {
        const service = data.service;
        setRoomServices((prev) => {
          const updated = [...prev];
          updated[roomIndex] = updated[roomIndex] || [];
          // Kiểm tra đã có dịch vụ này chưa
          const existIdx = updated[roomIndex].findIndex(
            (s) => s._id === service._id
          );
          if (existIdx !== -1) {
            // Nếu đã có thì tăng quantity (nếu muốn)
            updated[roomIndex][existIdx].quantity =
              (updated[roomIndex][existIdx].quantity || 1) + 1;
          } else {
            updated[roomIndex].push({ ...service, quantity: 1 });
          }
          return updated;
        });
        showNotify("Thông báo", "Đã thêm dịch vụ thành công!");
        setShowServiceModal(false);
      })
      .catch(() => {
        showNotify("Lỗi", "Không thể thêm dịch vụ!");
      });
  };

  // Add transportation service
  const addTransportationService = (serviceId) => {
    if (!serviceId) {
      showNotify("Thông báo", "Vui lòng chọn dịch vụ để thêm!");
      return;
    }

    fetch("/api/service/" + serviceId)
      .then((res) => res.json())
      .then((data) => {
        const service = data.service;
        setTransportationServices((prev) => {
          // Check if service already exists
          const existIdx = prev.findIndex((s) => s._id === service._id);
          if (existIdx !== -1) {
            // If exists, increase quantity
            const updated = [...prev];
            updated[existIdx].quantity = (updated[existIdx].quantity || 1) + 1;
            return updated;
          } else {
            return [...prev, { ...service, quantity: 1 }];
          }
        });
        showNotify("Thông báo", "Đã thêm dịch vụ vận chuyển thành công!");
        setShowTransportationModal(false);
      })
      .catch(() => {
        showNotify("Lỗi", "Không thể thêm dịch vụ!");
      });
  };

  // Remove transportation service
  const removeTransportationService = (serviceIndex) => {
    setTransportationServices((prev) =>
      prev.filter((_, idx) => idx !== serviceIndex)
    );
    showNotify("Thông báo", "Đã xóa dịch vụ!");
  };

  // Change transportation service quantity
  const changeTransportationQuantity = (serviceIndex, quantity) => {
    setTransportationServices((prev) => {
      const updated = [...prev];
      updated[serviceIndex].quantity = quantity;
      return updated;
    });
  };

  const removeService = (roomIndex, serviceIndex) => {
    setRoomServices((prev) => {
      const updated = [...prev];
      if (updated[roomIndex]) {
        updated[roomIndex].splice(serviceIndex, 1);
      }
      return updated;
    });
    showNotify("Thông báo", "Đã xóa dịch vụ thành công!");
  };

  const changeQuantity = (roomIndex, serviceIndex, quantity) => {
    setRoomServices((prev) => {
      const updated = [...prev];
      if (updated[roomIndex] && updated[roomIndex][serviceIndex]) {
        updated[roomIndex][serviceIndex].quantity = quantity;
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (roomServices.length === 0) {
      showNotify("Thông báo", "Vui lòng thêm dịch vụ trước khi xác nhận!");
      return;
    }
    setShowConfirm(true);
    setConfirmMsg("Bạn có chắc chắn muốn xác nhận các dịch vụ đã chọn?");
  };

  // Example handlers for confirm modal
  const handleConfirm = async () => {
    setShowConfirm(false);
    console.log("Room services:", roomServices);
    console.log("Transportation services:", transportationServices);

    try {
      // Update room services
      const roomResponse = await fetch(`/api/booking/service/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ services: roomServices }),
      });

      // Update transportation services
      const transportationResponse = await fetch(
        `/api/booking/transportation/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ services: transportationServices }),
        }
      );

      if (!roomResponse.ok || !transportationResponse.ok) {
        showNotify("Lỗi", "Không thể cập nhật dịch vụ!");
        throw new Error("Failed to update booking services");
      }
      showNotify("Thông báo", "Đã cập nhật dịch vụ thành công!");
    } catch (error) {
      showNotify("Lỗi", "Không thể cập nhật dịch vụ!");
      console.error("Error updating booking services:", error);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    showNotify("Thông báo", "Đã huỷ thao tác!");
  };

  return (
    <>
      <BackArrow to={`/booking/${bookingId}`} />
      <div className="p-4 bg-white shadow rounded-lg">
        <h1 className="text-2xl font-bold mb-4">
          Dịch vụ cho Đặt phòng #{booking.bookingCode}
        </h1>

        <h2 className="text-xl font-bold mb-4">Thông tin dịch vụ:</h2>

        {/* Transportation/General Services Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-lg font-semibold">Dịch vụ tổng hợp</h3>
          </div>
          <button
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition me-5 cursor-pointer"
            type="button"
            onClick={() => setShowTransportationModal(true)}
          >
            + Thêm dịch vụ tổng hợp
          </button>
          <ServicesForBookingDetail
            services={transportationServices || []}
            index="transportation"
            onRemove={(_, serviceIndex) =>
              removeTransportationService(serviceIndex)
            }
            onChangeQuantity={(_, serviceIndex, quantity) =>
              changeTransportationQuantity(serviceIndex, quantity)
            }
            isForEachRoom={false}
          />
        </div>

        {/* Room Services Section */}
        <h3 className="text-lg font-bold mb-4">Dịch vụ theo phòng:</h3>
        {booking.rooms && booking.rooms.length > 0 ? (
          booking.rooms.map((room, idx) => (
            <div key={idx} className="mb-4">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-lg font-semibold">
                  Phòng{" "}
                  {room.roomid?.roomNumber
                    ? room.roomid?.roomNumber + " - "
                    : " "}
                  {room.desiredRoomTypeId.name}
                </h3>
              </div>
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition me-5 cursor-pointer"
                type="button"
                onClick={() => {
                  setIndex(idx);
                  setShowServiceModal(true);
                }}
              >
                + Thêm dịch vụ
              </button>
              <ServicesForBookingDetail
                services={roomServices[idx] || []}
                index={idx}
                onRemove={(roomIndex, serviceIndex) =>
                  removeService(roomIndex, serviceIndex)
                }
                onChangeQuantity={(roomIndex, serviceIndex, quantity) =>
                  changeQuantity(roomIndex, serviceIndex, quantity)
                }
                isForEachRoom={true}
              />
            </div>
          ))
        ) : (
          <p>Không có phòng nào trong đặt phòng này.</p>
        )}
        <button
          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer
          ${
            booking.status === "completed" || booking.status === "cancelled"
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          onClick={handleSubmit}
          disabled={
            booking.status === "completed" || booking.status === "cancelled"
          }
          type="button"
        >
          Xác nhận dịch vụ
        </button>
      </div>
      <ServicesForBookingAdd
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onAdd={(serviceId) => addService(serviceId, index)}
      />
      <TransportationServiceAdd
        isOpen={showTransportationModal}
        onClose={() => setShowTransportationModal(false)}
        onAdd={(serviceId) => addTransportationService(serviceId)}
      />
      <NotificationModal
        isOpen={openShowNotify}
        title={notifyTitle}
        message={notifyMsg}
        onClose={() => setOpenShowNotify(false)}
      />
      <ConfirmModal
        isOpen={showConfirm}
        message={confirmMsg}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
