import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const StaffForm = ({ staff = {} }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "receptionist",
    shift: "",
    phoneNumber: "",
    address: "",
    avatar: "",
    identificationNumber: "",
    dateOfBirth: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    salary: "",
  });

  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    salary: "",
    identificationNumber: "",
    dateOfBirth: "",
    dateOfJoining: "",
    address: "",
  });

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        return value.trim() === "" ? "Tên không được để trống." : "";
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? "Email không hợp lệ."
          : "";
      case "phoneNumber":
        return !/^\d{9,11}$/.test(value)
          ? "Số điện thoại phải có 9-11 chữ số."
          : "";
      case "salary":
        return value && value < 0 ? "Lương không được âm." : "";
      case "identificationNumber":
        return !/^\d{8,12}$/.test(value) ? "CMND/CCCD không hợp lệ." : "";
      case "dateOfBirth":
        return !value ? "Ngày sinh không được để trống." : "";
      case "dateOfJoining":
        return !value ? "Ngày vào làm không được để trống." : "";
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

  useEffect(() => {
    if (!staff || !staff._id) return;

    // Prevent unnecessary updates
    setFormData((prev) => {
      // If the ID is the same, assume data hasn't changed
      if (prev._id === staff._id) return prev;

      return {
        _id: staff._id,
        name: staff.name || "",
        email: staff.email || "",
        position: staff.position || "receptionist",
        shift: staff.shift || "",
        phoneNumber: staff.phoneNumber || "",
        address: staff.address || "",
        avatar: staff.avatar || "",
        identificationNumber: staff.identificationNumber || "",
        dateOfBirth: staff.dateOfBirth
          ? new Date(staff.dateOfBirth).toISOString().split("T")[0]
          : "",
        dateOfJoining: staff.dateOfJoining
          ? new Date(staff.dateOfJoining).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        salary: staff.salary || "",
      };
    });
  }, [staff]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAllFields();

    if (Object.keys(errors).length > 0) {
      console.log("Validation errors", errors);
      return;
    }
    const formPayload = new FormData();

    formPayload.append("name", formData.name);
    formPayload.append("email", formData.email);
    formPayload.append("position", formData.position);
    formPayload.append("shift", formData.shift);
    formPayload.append("phoneNumber", formData.phoneNumber);
    formPayload.append("address", formData.address);
    formPayload.append("identificationNumber", formData.identificationNumber);
    formPayload.append("dateOfBirth", formData.dateOfBirth);
    formPayload.append("dateOfJoining", formData.dateOfJoining);
    formPayload.append("salary", formData.salary);

    const url = staff._id ? `/api/staff/${staff._id}` : "/api/staff/";
    const method = staff._id ? "PUT" : "POST";

    const respone = await fetch(url, {
      method: method,
      body: formPayload,
    });
    const data = await respone.json();
    console.log("Response data:", data);
    if (data.success) {
      if (!staff._id) {
        navigate("/staff");
      }
      alert("Thêm nhân viên thành công!");
    } else {
      alert("Lỗi khi thêm nhân viên: " + data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Họ và tên
          </label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            className="border px-3 py-2 rounded w-full"
            required
          />
          {formErrors.name && (
            <div className="text-sm text-red-600 mt-1">{formErrors.name}</div>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
            className="border px-3 py-2 rounded w-full"
            required
          />
          {formErrors.email && (
            <div className="text-sm text-red-600 mt-1">{formErrors.email}</div>
          )}
        </div>

        {/* Position */}
        <div>
          <label htmlFor="position" className="block font-medium mb-1">
            Chức vụ
          </label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="receptionist">Lễ tân</option>
            <option value="manager">Quản lý</option>
            <option value="housekeeping">Buồng phòng</option>{" "}
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        {/* Shift */}
        <div>
          <label htmlFor="shift" className="block font-medium mb-1">
            Ca làm việc
          </label>
          <input
            id="shift"
            name="shift"
            value={formData.shift}
            onChange={handleChange}
            placeholder="Sáng / Chiều / Đêm"
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block font-medium mb-1">
            Số điện thoại
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="0901234567"
            className="border px-3 py-2 rounded w-full"
          />
          {formErrors.phoneNumber && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.phoneNumber}
            </div>
          )}
        </div>

        {/* ID Number */}
        <div>
          <label
            htmlFor="identificationNumber"
            className="block font-medium mb-1"
          >
            CMND/CCCD
          </label>
          <input
            id="identificationNumber"
            name="identificationNumber"
            value={formData.identificationNumber}
            onChange={handleChange}
            placeholder="012345678901"
            className="border px-3 py-2 rounded w-full"
          />
          {formErrors.identificationNumber && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.identificationNumber}
            </div>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block font-medium mb-1">
            Địa chỉ
          </label>
          <input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Đường ABC, Quận X"
            className="border px-3 py-2 rounded w-full"
          />
          {formErrors.address && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.address}
            </div>
          )}
        </div>

        {/* Salary */}
        <div>
          <label htmlFor="salary" className="block font-medium mb-1">
            Lương
          </label>
          <input
            id="salary"
            name="salary"
            type="number"
            value={formData.salary}
            onChange={handleChange}
            placeholder="10000000"
            className="border px-3 py-2 rounded w-full"
          />
          {formErrors.salary && (
            <div className="text-sm text-red-600 mt-1">{formErrors.salary}</div>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block font-medium mb-1">
            Ngày sinh
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />
          {formErrors.dateOfBirth && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.dateOfBirth}
            </div>
          )}
        </div>

        {/* Date of Joining */}
        <div>
          <label htmlFor="dateOfJoining" className="block font-medium mb-1">
            Ngày vào làm
          </label>
          <input
            id="dateOfJoining"
            name="dateOfJoining"
            type="date"
            value={formData.dateOfJoining}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />
          {formErrors.dateOfJoining && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.dateOfJoining}
            </div>
          )}
        </div>
      </div>

      {/* Avatar
      <div className="mt-6">
        <label className="block font-medium mb-2">Ảnh đại diện</label>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="bg-gray-100 px-4 py-2 border rounded cursor-pointer hover:bg-gray-200">
            Tải ảnh
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </label>
          <input
            type="text"
            name="avatar"
            value={formData.avatar}
            onChange={handleChange}
            placeholder="Hoặc dán URL ảnh..."
            className="border px-3 py-2 rounded flex-1 min-w-[200px]"
          />
        </div>
        {formData.avatar && (
          <div className="mt-4 flex justify-center">
            <img
              src={formData.avatar}
              alt="Avatar preview"
              className="w-24 h-24 rounded-full object-cover border"
            />
          </div>
        )}
      </div> */}

      <button
        type="submit"
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Áp dụng
      </button>
    </form>
  );
};

export default StaffForm;
