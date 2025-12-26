import React from "react";

export default function CustomerInput({
  formData,
  formErrors,
  onChange,
  disable = false,
}) {
  return (
    <>
      {/* Danh xưng, Họ và Tên */}
      <div className="flex gap-4">
        {/* Danh xưng */}
        <div className="flex-shrink-0 w-24">
          <label className="block text-sm font-medium">Danh xưng</label>
          <select
            name="honorific"
            value={formData.honorific}
            onChange={onChange}
            className={`border rounded w-full p-2 ${
              disable ? "bg-gray-200" : ""
            }`}
            disabled={disable ? true : false}
          >
            <option value="Ông">Ông</option>
            <option value="Bà">Bà</option>
          </select>
          {formErrors.honorific && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.honorific}
            </div>
          )}
        </div>

        {/* Họ */}
        <div className="flex-1">
          <label className="block text-sm font-medium">Họ</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            className={`border rounded w-full p-2 ${
              disable ? "bg-gray-200" : ""
            }`}
            disabled={disable ? true : false}
          />
          {formErrors.lastName && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.lastName}
            </div>
          )}
        </div>

        {/* Tên */}
        <div className="flex-1">
          <label className="block text-sm font-medium">Tên</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            className={`border rounded w-full p-2 ${
              disable ? "bg-gray-200" : ""
            }`}
            disabled={disable ? true : false}
          />
          {formErrors.firstName && (
            <div className="text-sm text-red-600 mt-1">
              {formErrors.firstName}
            </div>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          className={`border rounded w-full p-2 ${
            disable ? "bg-gray-200" : ""
          }`}
          disabled={disable ? true : false}
        />
        {formErrors.email && (
          <div className="text-sm text-red-600 mt-1">{formErrors.email}</div>
        )}
      </div>

      {/* Số điện thoại */}
      <div>
        <label className="block text-sm font-medium">Số điện thoại</label>
        <input
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={onChange}
          className={`border rounded w-full p-2 ${
            disable ? "bg-gray-200" : ""
          }`}
          disabled={disable ? true : false}
        />
        {formErrors.phoneNumber && (
          <div className="text-sm text-red-600 mt-1">
            {formErrors.phoneNumber}
          </div>
        )}
      </div>

      {/* Loại giấy tờ */}
      <div>
        <label className="block text-sm font-medium">Loại giấy tờ</label>
        <select
          name="identification"
          value={formData.identification}
          onChange={onChange}
          className={`border rounded w-full p-2 ${
            disable ? "bg-gray-200" : ""
          }`}
          disabled={disable ? true : false}
        >
          <option value="national_id">CMND/CCCD</option>
          <option value="passport">Hộ chiếu</option>
          <option value="driver_license">Bằng lái xe</option>
        </select>
      </div>

      {/* Số giấy tờ */}
      <div>
        <label className="block text-sm font-medium">Số giấy tờ</label>
        <input
          type="text"
          name="identificationNumber"
          value={formData.identificationNumber}
          onChange={onChange}
          className={`border rounded w-full p-2 ${
            disable ? "bg-gray-200" : ""
          }`}
          disabled={disable ? true : false}
        />
        {formErrors.identificationNumber && (
          <div className="text-sm text-red-600 mt-1">
            {formErrors.identificationNumber}
          </div>
        )}
      </div>

      {/* Quốc tịch */}
      <div>
        <label className="block text-sm font-medium">Quốc tịch</label>
        <input
          type="text"
          name="nationality"
          value={formData.nationality}
          onChange={onChange}
          className={`border rounded w-full p-2 ${
            disable ? "bg-gray-200" : ""
          }`}
          disabled={disable ? true : false}
        />
      </div>

      {/* Ngày sinh */}
      <div>
        <label className="block text-sm font-medium">Ngày sinh</label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={onChange}
          className={`border rounded w-full p-2 ${
            disable ? "bg-gray-200" : ""
          }`}
          disabled={disable ? true : false}
        />
        {formErrors.dateOfBirth && (
          <div className="text-sm text-red-600 mt-1">
            {formErrors.dateOfBirth}
          </div>
        )}
      </div>
    </>
  );
}
