import React from "react";

const formatDateforInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

export default function MainGuestInput({
  mainGuest,
  onChange,
  formErrors,
  disabled = false,
}) {
  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Khách chính</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Danh xưng */}
        <div>
          <label className="block text-sm font-medium mb-1">Danh xưng</label>
          <select
            name="honorific"
            value={mainGuest.honorific || ""}
            onChange={onChange}
            disabled={disabled}
            className={`border rounded w-full p-2 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          >
            <option value="">Chọn danh xưng</option>
            <option value="Ông">Ông</option>
            <option value="Bà">Bà</option>
            <option value="Khác">Khác</option>
          </select>
          {formErrors?.honorific && (
            <span className="text-red-500 text-xs">{formErrors.honorific}</span>
          )}
        </div>

        {/* Họ */}
        <div>
          <label className="block text-sm font-medium mb-1">Họ</label>
          <input
            type="text"
            name="lastName"
            value={mainGuest.lastName || ""}
            onChange={onChange}
            disabled={disabled}
            className={`border rounded w-full p-2 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            placeholder="Họ"
          />
          {formErrors?.lastName && (
            <span className="text-red-500 text-xs">{formErrors.lastName}</span>
          )}
        </div>
        {/* Tên */}
        <div>
          <label className="block text-sm font-medium mb-1">Tên</label>
          <input
            type="text"
            name="firstName"
            value={mainGuest.firstName || ""}
            onChange={onChange}
            disabled={disabled}
            className={`border rounded w-full p-2 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            placeholder="Tên"
          />
          {formErrors?.firstName && (
            <span className="text-red-500 text-xs">{formErrors.firstName}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Ngày sinh */}
        <div>
          <label className="block text-sm font-medium mb-1">Ngày sinh</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formatDateforInput(mainGuest.dateOfBirth) || ""}
            onChange={onChange}
            disabled={disabled}
            className={`border rounded w-full p-2 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
          {formErrors?.dateOfBirth && (
            <span className="text-red-500 text-xs">
              {formErrors.dateOfBirth}
            </span>
          )}
        </div>

        {/* Số CMND/CCCD */}
        <div>
          <label className="block text-sm font-medium mb-1">Số CMND/CCCD</label>
          <input
            type="text"
            name="identificationNumber"
            value={mainGuest.identificationNumber || ""}
            onChange={onChange}
            disabled={disabled}
            className={`border rounded w-full p-2 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            placeholder="CMND/CCCD"
          />
          {formErrors?.identificationNumber && (
            <span className="text-red-500 text-xs">
              {formErrors.identificationNumber}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Quốc tịch */}
        <div>
          <label className="block text-sm font-medium mb-1">Quốc tịch</label>
          <input
            type="text"
            name="nationality"
            value={mainGuest.nationality || ""}
            onChange={onChange}
            disabled={disabled}
            className={`border rounded w-full p-2 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            placeholder="Quốc tịch"
          />
          {formErrors?.nationality && (
            <span className="text-red-500 text-xs">
              {formErrors.nationality}
            </span>
          )}
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Số điện thoại
          </label>
          <input
            type="text"
            name="phoneNumber"
            value={mainGuest.phoneNumber || ""}
            onChange={onChange}
            disabled={disabled}
            className={`border rounded w-full p-2 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            placeholder="Số điện thoại"
          />
          {formErrors?.phoneNumber && (
            <span className="text-red-500 text-xs">
              {formErrors.phoneNumber}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
