import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NotificationModal from "./NotificationModal";

export default function TypeForm({ type = {} }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    maxGuest: "",
    extraBedAllowed: false,
    extraBedPrice: "",
    description: "",
    pricePerNight: "",
    amenities: [],
  });

  const availableAmenities = [
    { value: "wifi", label: "WiFi" },
    { value: "air_conditioning", label: "Điều hòa" },
    { value: "tv", label: "TV" },
    { value: "minibar", label: "Minibar" },
    { value: "balcony", label: "Ban công" },
    { value: "sea_view", label: "Hướng biển" },
    { value: "room_service", label: "Dịch vụ phòng" },
    { value: "safe_box", label: "Két an toàn" },
    { value: "coffee_maker", label: "Máy pha cà phê" },
    { value: "hair_dryer", label: "Máy sấy tóc" },
    { value: "bath_tub", label: "Bồn tắm" },
    { value: "shower", label: "Vòi sen" },
    { value: "desk", label: "Bàn làm việc" },
    { value: "wardrobe", label: "Tủ quần áo" },
    { value: "telephone", label: "Điện thoại" },
    { value: "heating", label: "Sưởi ấm" },
    { value: "kitchenette", label: "Bếp nhỏ" },
  ];

  const [formErrors, setFormErrors] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (type._id) {
      setFormData({
        name: type.name || "",
        capacity: type.capacity?.toString() || "",
        maxGuest: type.maxGuest?.toString() || "",
        extraBedAllowed: type.extraBedAllowed || false,
        extraBedPrice: type.extraBedPrice?.toString() || "",
        description: type.description || "",
        pricePerNight: type.pricePerNight?.toString() || "",
        amenities: type.amenities || [],
      });
    }
  }, [type]);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim())
      errors.name = "Tên loại phòng không được để trống.";
    if (
      !formData.capacity ||
      isNaN(formData.capacity) ||
      formData.capacity <= 0
    )
      errors.capacity = "Sức chứa phải là số nguyên dương.";
    if (
      !formData.maxGuest ||
      isNaN(formData.maxGuest) ||
      formData.maxGuest <= 0
    )
      errors.maxGuest = "Số khách tối đa phải là số nguyên dương.";
    if (
      formData.extraBedPrice &&
      (isNaN(formData.extraBedPrice) || formData.extraBedPrice < 0)
    )
      errors.extraBedPrice = "Giá giường phụ phải là số không âm.";
    if (
      !formData.pricePerNight ||
      isNaN(formData.pricePerNight) ||
      formData.pricePerNight < 0
    )
      errors.pricePerNight = "Giá phải là một số hợp lệ.";
    setFormErrors(errors);
    return errors;
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    if (name === "extraBedAllowed") {
      setFormData((prev) => ({
        ...prev,
        extraBedAllowed: checked,
        extraBedPrice: checked ? 90000 : 0,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAmenityChange = (amenityValue) => {
    setFormData((prev) => {
      const amenities = prev.amenities.includes(amenityValue)
        ? prev.amenities.filter((a) => a !== amenityValue)
        : [...prev.amenities, amenityValue];
      return { ...prev, amenities };
    });
  };

  const showNotify = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) return;

    const url = type._id ? `/api/type/${type._id}` : "/api/type";
    const method = type._id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity),
          maxGuest: Number(formData.maxGuest),
          extraBedAllowed: formData.extraBedAllowed,
          extraBedPrice: formData.extraBedPrice
            ? Number(formData.extraBedPrice)
            : 0,
          pricePerNight: Number(formData.pricePerNight),
          amenities: formData.amenities,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotify(
          type._id ? "Cập nhật thành công!" : "Tạo loại phòng thành công!"
        );
      } else {
        showNotify(data.message || "Thao tác thất bại.");
      }
    } catch (err) {
      console.error("Error saving type:", err);
      showNotify("Có lỗi xảy ra khi lưu loại phòng.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label className="block font-medium">Tên loại phòng</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
          {formErrors.name && (
            <p className="text-red-600 text-sm">{formErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">Sức chứa</label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
          {formErrors.capacity && (
            <p className="text-red-600 text-sm">{formErrors.capacity}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">Số khách tối đa</label>
          <input
            type="number"
            name="maxGuest"
            value={formData.maxGuest}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
          {formErrors.maxGuest && (
            <p className="text-red-600 text-sm">{formErrors.maxGuest}</p>
          )}
        </div>

        <div>
          <label className="inline-flex items-center font-medium">
            <input
              type="checkbox"
              name="extraBedAllowed"
              checked={formData.extraBedAllowed}
              onChange={handleChange}
              className="mr-2"
            />
            Cho phép giường phụ
          </label>
        </div>

        {formData.extraBedAllowed && (
          <div>
            <label className="block font-medium">Giá giường phụ</label>
            <input
              type="number"
              name="extraBedPrice"
              value={formData.extraBedPrice}
              onChange={handleChange}
              className="border rounded w-full p-2"
            />
            {formErrors.extraBedPrice && (
              <p className="text-red-600 text-sm">{formErrors.extraBedPrice}</p>
            )}
          </div>
        )}

        <div>
          <label className="block font-medium">Giá mỗi đêm</label>
          <input
            type="number"
            name="pricePerNight"
            value={formData.pricePerNight}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
          {formErrors.pricePerNight && (
            <p className="text-red-600 text-sm">{formErrors.pricePerNight}</p>
          )}
        </div>

        <div>
          <label className="block font-medium mb-2">Tiện nghi</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border rounded p-4">
            {availableAmenities.map((amenity) => (
              <label
                key={amenity.value}
                className="inline-flex items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity.value)}
                  onChange={() => handleAmenityChange(amenity.value)}
                  className="mr-2"
                />
                <span className="text-sm">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium">Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
        </div>

        <div className="flex justify-end">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {type._id ? "Cập nhật" : "Tạo"}
          </button>
        </div>
      </form>

      <NotificationModal
        isOpen={showNotification}
        title="Thông báo"
        message={notificationMessage}
        onClose={() => {
          setShowNotification(false);
          navigate("/type");
        }}
      />
    </>
  );
}
