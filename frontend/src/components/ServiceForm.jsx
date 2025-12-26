import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import NotificationModal from "./NotificationModal";

const CATEGORY_OPTIONS = [
  { value: "per_unit", label: "Theo đơn vị" },
  { value: "per_person", label: "Theo người" },
  { value: "per_duration", label: "Theo thời gian" },
  { value: "fixed", label: "Giá cố định" },
  { value: "additional_Bed", label: "Giường phụ" },
  { value: "transportation", label: "Xe đưa đón" },
  { value: "minibar", label: "Minibar" },
];

const UNIT_OPTIONS = [
  { value: "unit", label: "Đơn vị" },
  { value: "person", label: "Người" },
  { value: "hour", label: "Giờ" },
  { value: "day", label: "Ngày" },
  { value: "fixed", label: "Cố định" },
];

export default function ServiceForm({ service = {} }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    unit: "unit",
    unitDisplay: "",
    category: "per_unit",
    forEachRoom: false,
    isActive: true,
    images: [],
    inventoryItemId: [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [availableMinibarInventories, setAvailableMinibarInventories] =
    useState([]);

  useEffect(() => {
    if (!service || !service._id) return;

    setFormData({
      name: service.name || "",
      description: service.description || "",
      price: service.price || "",
      unit: service.unit || "unit",
      unitDisplay: service.unitDisplay || "",
      category: service.category || "per_unit",
      forEachRoom:
        service.forEachRoom !== undefined ? service.forEachRoom : false,
      isActive: service.isActive !== undefined ? service.isActive : true,
      images: service.images || [],
      inventoryItemId: service.inventoryItemId || [],
    });
  }, [service]);

  // Fetch available minibar inventories when category is minibar
  useEffect(() => {
    if (formData.category === "minibar") {
      fetch(`/api/inventories/minibar/available`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableMinibarInventories(data);
        })
        .catch((err) => {
          console.error("Error fetching minibar inventories:", err);
        });
    }
  }, [formData.category, service?._id]);

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Tên dịch vụ không được để trống.";
        return "";
      case "price":
        if (value === "" || value === null) return "Giá không được để trống.";
        if (isNaN(Number(value)) || Number(value) < 0)
          return "Giá phải là số không âm.";
        return "";
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
    const { name, value, type, checked, options } = e.target;

    setFormData((prev) => {
      let updated = { ...prev };

      // Handle multi-select for inventoryItemId
      if (name === "inventoryItemId" && type === "select-multiple") {
        const selectedValues = Array.from(options)
          .filter((option) => option.selected)
          .map((option) => option.value);
        updated[name] = selectedValues;
      } else {
        updated[name] = type === "checkbox" ? checked : value;
      }

      // ✅ Auto adjust unit based on category
      if (name === "category") {
        if (value === "additional_Bed") {
          updated.unit = "day";
          updated.unitDisplay = "đêm";
          updated.forEachRoom = true;
        }

        if (value === "transportation") {
          updated.unit = "fixed";
          updated.unitDisplay = "chuyến";
          updated.forEachRoom = false;
        }
      }

      return updated;
    });

    setFormErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
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
      return;
    }

    const url = service._id ? `/api/service/${service._id}` : "/api/service";
    const method = service._id ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          price: formData.price,
          unit: formData.unit || undefined,
          unitDisplay: formData.unitDisplay || undefined,
          category: formData.category,
          forEachRoom: formData.forEachRoom,
          isActive: formData.isActive,
          images: formData.images,
          inventoryItemId:
            formData.category === "minibar" &&
            formData.inventoryItemId &&
            formData.inventoryItemId.length > 0
              ? formData.inventoryItemId
              : undefined,
        }),
      });
      console.log("a");

      const data = await response.json();
      if (data.success) {
        showNotify(
          service._id
            ? `Cập nhật dịch vụ "${formData.name}" thành công!`
            : `Thêm dịch vụ "${formData.name}" thành công!`
        );
      } else {
        // Handle validation errors from server
        if (data.message && data.message.includes("Validation failed")) {
          showNotify(
            "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin."
          );
        } else {
          showNotify(
            service._id
              ? `Cập nhật dịch vụ "${formData.name}" thất bại!`
              : `Thêm dịch vụ "${formData.name}" thất bại!`
          );
        }
      }
    } catch (error) {
      console.log("Lỗi:" + error);
      if (error.message && error.message.includes("Validation failed")) {
        showNotify(
          "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại loại tính giá và đơn vị."
        );
      } else {
        showNotify("Có lỗi xảy ra khi lưu dịch vụ.");
      }
    }
  };

  const handleDelete = () => {
    if (!service._id) return;
    fetch(`/api/service/${service._id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showNotify(`Xóa dịch vụ "${service.name}" thành công!`);
        } else {
          showNotify(`Xóa dịch vụ thất bại!`);
        }
      })
      .catch(() => {
        showNotify("Có lỗi xảy ra khi xóa dịch vụ.");
      });
  };

  const handleConfirm = () => {
    if (!service._id) return;
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {/* Tên dịch vụ */}
        <div>
          <label className="block text-sm font-medium">Tên dịch vụ *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
          {formErrors.name && (
            <div className="text-sm text-red-600 mt-1">{formErrors.name}</div>
          )}
        </div>

        {/* Giá */}
        <div>
          <label className="block text-sm font-medium">Giá *</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="border rounded w-full p-2"
              min="0"
            />
          </div>
          {formErrors.price && (
            <div className="text-sm text-red-600 mt-1">{formErrors.price}</div>
          )}
        </div>

        {/* Đơn vị */}
        <div>
          <label className="block text-sm font-medium">Đơn vị</label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="border rounded w-full p-2"
          >
            {UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hiển thị đơn vị */}
        <div>
          <label className="block text-sm font-medium">Hiển thị đơn vị</label>
          <input
            type="text"
            name="unitDisplay"
            value={formData.unitDisplay}
            onChange={handleChange}
            className="border rounded w-full p-2"
            placeholder="Ví dụ: lần, suất, km... (tùy chọn)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Cách hiển thị đơn vị tùy chỉnh cho người dùng (có thể để trống)
          </p>
        </div>

        {/* Loại dịch vụ */}
        <div>
          <label className="block text-sm font-medium">Loại tính giá</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="border rounded w-full p-2"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tính theo phòng */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="forEachRoom"
              checked={formData.forEachRoom}
              onChange={handleChange}
              className="rounded"
            />
            <span className="text-sm font-medium">Tính theo phòng</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Đánh dấu nếu dịch vụ này được tính riêng cho từng phòng
          </p>
        </div>

        {/* Minibar Inventory Selection */}
        {formData.category === "minibar" && (
          <div>
            <label className="block text-sm font-medium">
              Chọn vật tư minibar (có thể chọn nhiều)
            </label>
            <select
              name="inventoryItemId"
              value={formData.inventoryItemId}
              onChange={handleChange}
              className="border rounded w-full p-2"
              multiple
              size="5"
            >
              {availableMinibarInventories.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều vật tư
            </p>
          </div>
        )}

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium">Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="border rounded w-full p-2"
            placeholder="Mô tả dịch vụ (có thể để trống)"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
          >
            Lưu thay đổi
          </button>
          {service._id && (
            <button
              type="button"
              onClick={handleConfirm}
              className="ml-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 cursor-pointer"
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
        message="Bạn có chắc chắn muốn xóa dịch vụ này?"
      />
      <NotificationModal
        isOpen={showNotification}
        title="Thông báo"
        message={notificationMessage}
        onClose={() => {
          setShowNotification(false);
          navigate("/service");
        }}
      />
    </>
  );
}
