import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import NotificationModal from "./NotificationModal";

export default function RoomForm({ room = {} }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const [formData, setFormData] = useState({
    roomNumber: "",
    typeid: "",
    floor: "",
    status: "available",
    housekeepingStatus: "clean",
    doNotDisturb: false,
  });

  const [formErrors, setFormErrors] = useState({
    roomNumber: "",
    typeid: "",
    floor: "",
    status: "",
  });

  const [roomTypes, setRoomTypes] = useState([]);

  useEffect(() => {
    if (!room || !room._id) return;
    setFormData({
      roomNumber: room.roomNumber || "",
      typeid: room.typeid?._id || room.typeid || "",
      floor: room.floor || "",
      status: room.status || "available",
      housekeepingStatus: room.housekeepingStatus || "clean",
      doNotDisturb: room.doNotDisturb || false,
    });
  }, [room]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch("/api/type");
        if (!response.ok) throw new Error("Failed to fetch room types");

        const data = await response.json();
        if (!data.success) throw new Error("Failed to fetch room types");

        const formattedTypes = data.types.map((type) => ({
          id: type._id,
          name: type.name,
        }));
        setRoomTypes(formattedTypes);
      } catch (error) {
        console.error("Error fetching types:", error);
      }
    };

    fetchTypes();
  }, []);

  const validateField = (name, value) => {
    switch (name) {
      case "roomNumber":
        if (!value.trim()) return "Số phòng không được để trống.";
        if (!/^\d+$/.test(value)) return "Số phòng phải là số.";
        return "";
      case "floor":
        if (!value.trim()) return "Tầng không được để trống.";
        if (!/^\d+$/.test(value)) return "Tầng phải là số.";
        return "";
      case "typeid":
        return !value ? "Loại phòng không được để trống." : "";
      case "status":
        return !["available", "booked", "occupied", "maintenance"].includes(
          value
        )
          ? "Trạng thái không hợp lệ."
          : "";
      default:
        return "";
    }
  };

  const validateAllFields = () => {
    const errors = {};
    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) errors[name] = error;
    });

    setFormErrors(errors);
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    const error = validateField(name, value);
    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const showNotify = (message) => {
    if (
      document.activeElement &&
      typeof document.activeElement.blur === "function"
    ) {
      document.activeElement.blur();
    }
    setNotificationMessage(message);
    setShowNotification(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors", errors);
      return;
    }

    const url = room._id ? `/api/room/${room._id}` : "/api/room";
    const method = room._id ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showNotify(
          room._id
            ? `Cập nhật phòng ${formData.roomNumber} thành công!`
            : `Thêm phòng ${formData.roomNumber} thành công!`
        );
      } else {
        console.log("Cập nhật phòng thất bại: " + data.message);
        showNotify(
          room._id
            ? `Cập nhật phòng ${formData.roomNumber} thất bại!`
            : `Thêm phòng ${formData.roomNumber} thất bại!`
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showNotify("Có lỗi xảy ra khi lưu phòng.");
    }
  };

  const handleDelete = () => {
    if (!room._id) return;

    fetch(`/api/room/${room._id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showNotify(`Xóa phòng ${room.roomNumber} thành công!`);
        } else {
          showNotify(`Xóa phòng thất bại!`);
        }
      })
      .catch((err) => {
        console.error("Error deleting room:", err);
        showNotify("Có lỗi xảy ra khi xóa phòng.");
      });
  };

  const handleConfirm = () => {
    if (!room._id) return;
    setNotificationMessage(`Xoá phòng ${room.roomNumber} thành công!`);
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {/* Số phòng */}
        <div>
          <label className="block text-sm font-medium">Số phòng</label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
          {formErrors.roomNumber && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.roomNumber}
            </div>
          )}
        </div>

        {/* Tầng */}
        <div>
          <label className="block text-sm font-medium">Tầng</label>
          <input
            type="text"
            name="floor"
            value={formData.floor}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
          {formErrors.floor && (
            <div className="text-sm text-red-600 mt-1">{formErrors.floor}</div>
          )}
        </div>

        {/* Loại phòng */}
        <div>
          <label className="block text-sm font-medium">Loại phòng</label>
          <select
            name="typeid"
            value={formData.typeid}
            onChange={handleChange}
            className="border rounded w-full p-2"
          >
            <option value="">-- Chọn loại phòng --</option>
            {roomTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {formErrors.typeid && (
            <div className="text-sm text-red-600 mt-1">{formErrors.typeid}</div>
          )}
        </div>

        {/* Housekeeping Status - Only show in detail page */}
        {room._id && (
          <div>
            <label className="block text-sm font-medium">
              Trạng thái dọn phòng
            </label>
            <select
              name="housekeepingStatus"
              value={formData.housekeepingStatus}
              onChange={handleChange}
              className="border rounded w-full p-2"
            >
              <option value="clean">Sạch</option>
              <option value="dirty">Bẩn</option>
              <option value="cleaning">Đang dọn</option>
            </select>
          </div>
        )}

        {/* Do Not Disturb - Only show in detail page */}
        {room._id && (
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="doNotDisturb"
                checked={formData.doNotDisturb}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    doNotDisturb: e.target.checked,
                  }))
                }
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Không làm phiền (DND)</span>
            </label>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Lưu thay đổi
          </button>
          {room._id && (
            <button
              type="button"
              onClick={handleConfirm}
              className="ml-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Xóa
            </button>
          )}
        </div>
      </form>
      <ConfirmModal
        isOpen={showModal}
        onConfirm={handleDelete}
        onCancel={handleCancel}
        message="Bạn có chắc chắn muốn xóa phòng này?"
      />
      <NotificationModal
        isOpen={showNotification}
        title="Thông báo"
        message={notificationMessage}
        onClose={() => {
          setShowNotification(false);
          navigate("/room");
        }}
      />
    </>
  );
}
