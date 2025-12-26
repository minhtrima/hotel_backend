import React from "react";

const formatDateforInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

export default function BookingInput({
  formData,
  rooms,
  availableRoomTypeCounts = {},
  allRoomsInBooking = [],
  currentRoomIndex = 0,
  formErrors,
  onChange,
  checkInNow = false,
  roomTypes,
  disableCheckIn = false,
  disabled = false,
}) {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Loại phòng mong muốn
        </label>
        <select
          name="desiredRoomTypeId"
          value={formData.desiredRoomTypeId || ""}
          onChange={onChange}
          className={`w-full border border-black rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 
          ${checkInNow ? "bg-gray-200 cursor-not-allowed" : "cursor-pointer"}`}
          disabled={checkInNow}
        >
          <option value="">-- Chọn loại phòng --</option>
          {roomTypes
            .filter((type) => {
              // If no dates selected, show all types
              if (
                !formData.expectedCheckInDate ||
                !formData.expectedCheckOutDate
              ) {
                return true;
              }
              // If dates selected but no availability data yet (undefined), show all
              if (
                availableRoomTypeCounts === undefined ||
                typeof availableRoomTypeCounts !== "object" ||
                Object.keys(availableRoomTypeCounts).length === 0
              ) {
                return true;
              }

              // Count how many OTHER rooms in this booking have selected this type
              const typeIdStr = (type._id || type.id).toString();
              const selectedInBooking = allRoomsInBooking.filter(
                (room, idx) =>
                  idx !== currentRoomIndex &&
                  room.desiredRoomTypeId === typeIdStr
              ).length;

              // Available count from backend minus already selected in this booking
              const availableCount =
                (availableRoomTypeCounts[typeIdStr] || 0) - selectedInBooking;

              console.log(
                `Type ${type.name}: backend=${
                  availableRoomTypeCounts[typeIdStr] || 0
                }, selectedInBooking=${selectedInBooking}, available=${availableCount}`
              );

              // Show if still available after subtracting already selected
              return availableCount > 0;
            })
            .map((type) => (
              <option key={type._id || type.id} value={type._id || type.id}>
                {type.name} - {type.pricePerNight?.toLocaleString()}₫ (sức chứa:{" "}
                {type.capacity})
              </option>
            ))}
        </select>
        {formData.expectedCheckInDate &&
          formData.expectedCheckOutDate &&
          typeof availableRoomTypeCounts === "object" &&
          Object.keys(availableRoomTypeCounts).length === 0 && (
            <p className="text-sm text-red-500 mt-1">
              Không có phòng trống trong khoảng thời gian này
            </p>
          )}
      </div>

      {/* Dự kiến nhận phòng */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          {formData.actualCheckInDate
            ? "Thời gian nhận phòng"
            : "Thời gian dự kiến nhận phòng"}
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            name="expectedCheckInDate"
            value={
              formData.actualCheckInDate
                ? formatDateforInput(formData.actualCheckInDate)
                : formatDateforInput(formData.expectedCheckInDate) || ""
            }
            onChange={onChange}
            className={`flex-1 border rounded p-2 ${
              disableCheckIn || formData.actualCheckInDate
                ? "bg-gray-200 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={disableCheckIn}
          />
        </div>
      </div>

      {/* Dự kiến trả phòng */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          {formData.actualCheckOutDate
            ? "Thời gian trả phòng"
            : "Thời gian dự kiến trả phòng"}
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            name="expectedCheckOutDate"
            value={
              formData.actualCheckOutDate
                ? formatDateforInput(formData.actualCheckOutDate)
                : formatDateforInput(formData.expectedCheckOutDate) || ""
            }
            onChange={onChange}
            className={`flex-1 border rounded p-2 cursor-pointer
             ${
               formData.actualCheckOutDate
                 ? "bg-gray-200 cursor-not-allowed"
                 : "cursor-pointer"
             }`}
            disabled={formData.actualCheckOutDate}
          />
        </div>
      </div>

      {/* Số khách */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Số người lớn */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Số người lớn
            </label>
            <div className="flex items-center border rounded w-full overflow-hidden">
              <button
                type="button"
                disabled={disabled}
                className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold ${
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
                onClick={() =>
                  !disabled &&
                  onChange({
                    target: {
                      name: "numberOfAdults",
                      value: Math.max(
                        1,
                        (parseInt(formData.numberOfAdults) || 1) - 1
                      ),
                    },
                  })
                }
              >
                −
              </button>
              <input
                type="number"
                name="numberOfAdults"
                min="1"
                max={(() => {
                  const selectedType = roomTypes.find(
                    (t) => t._id === formData.desiredRoomTypeId
                  );
                  return selectedType ? selectedType.maxGuest : 10;
                })()}
                value={formData.numberOfAdults || 1}
                onChange={onChange}
                onWheel={(e) => e.target.blur()}
                disabled={disabled}
                required
                className={`w-full text-center p-2 appearance-none focus:outline-none ${
                  disabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                placeholder="Số người lớn"
              />
              <button
                type="button"
                disabled={
                  disabled ||
                  (() => {
                    const selectedType = roomTypes.find(
                      (t) => t._id === formData.desiredRoomTypeId
                    );
                    const maxCapacity = selectedType
                      ? selectedType.maxGuest
                      : 10;
                    return (
                      (parseInt(formData.numberOfAdults) || 1) >= maxCapacity
                    );
                  })()
                }
                className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold ${
                  disabled ||
                  (() => {
                    const selectedType = roomTypes.find(
                      (t) => t._id === formData.desiredRoomTypeId
                    );
                    const maxCapacity = selectedType
                      ? selectedType.maxGuest
                      : 10;
                    return (
                      (parseInt(formData.numberOfAdults) || 1) >= maxCapacity
                    );
                  })()
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                onClick={() => {
                  if (!disabled) {
                    const selectedType = roomTypes.find(
                      (t) => t._id === formData.desiredRoomTypeId
                    );
                    const maxCapacity = selectedType
                      ? selectedType.maxGuest
                      : 10;
                    const currentValue = parseInt(formData.numberOfAdults) || 1;
                    if (currentValue < maxCapacity) {
                      onChange({
                        target: {
                          name: "numberOfAdults",
                          value: currentValue + 1,
                        },
                      });
                    }
                  }
                }}
              >
                +
              </button>
            </div>
            {formErrors.numberOfAdults && (
              <div className="text-sm text-red-600 mt-1">
                {formErrors.numberOfAdults}
              </div>
            )}
          </div>

          {/* Số trẻ em */}
          <div>
            <label className="block text-sm font-medium mb-1">Số trẻ em</label>
            <div className="flex items-center border rounded w-full overflow-hidden">
              <button
                type="button"
                disabled={disabled}
                className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold ${
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
                onClick={() =>
                  !disabled &&
                  onChange({
                    target: {
                      name: "numberOfChildren",
                      value: Math.max(
                        0,
                        (parseInt(formData.numberOfChildren) || 0) - 1
                      ),
                    },
                  })
                }
              >
                −
              </button>
              <input
                type="number"
                name="numberOfChildren"
                min="0"
                max="2"
                value={formData.numberOfChildren || 0}
                onChange={onChange}
                onWheel={(e) => e.target.blur()}
                disabled={disabled}
                className={`w-full text-center p-2 appearance-none focus:outline-none ${
                  disabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                placeholder="Số trẻ em"
              />
              <button
                type="button"
                disabled={
                  disabled || (parseInt(formData.numberOfChildren) || 0) >= 2
                }
                className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold ${
                  disabled || (parseInt(formData.numberOfChildren) || 0) >= 2
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                onClick={() => {
                  if (
                    !disabled &&
                    (parseInt(formData.numberOfChildren) || 0) < 2
                  ) {
                    onChange({
                      target: {
                        name: "numberOfChildren",
                        value: (parseInt(formData.numberOfChildren) || 0) + 1,
                      },
                    });
                  }
                }}
              >
                +
              </button>
            </div>
            {formErrors.numberOfChildren && (
              <div className="text-sm text-red-600 mt-1">
                {formErrors.numberOfChildren}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extra Bed */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="extraBedAdded"
            checked={formData.extraBedAdded || false}
            onChange={(e) => {
              onChange({
                target: {
                  name: "extraBedAdded",
                  value: e.target.checked,
                },
              });
            }}
            disabled={(() => {
              // Find selected room type to check capacity
              const selectedType = roomTypes.find(
                (t) => t._id === formData.desiredRoomTypeId
              );
              if (!selectedType) return disabled;
              const capacity = Number(selectedType.capacity);
              const numberOfAdults = Number(formData.numberOfAdults) || 1;
              const isDisabledByCapacity = numberOfAdults > capacity;
              // Disable checkbox if adults exceed capacity (forced extra bed)
              return disabled || isDisabledByCapacity;
            })()}
            className={`${
              disabled ||
              (() => {
                const selectedType = roomTypes.find(
                  (t) => t._id === formData.desiredRoomTypeId
                );
                if (!selectedType) return false;
                const capacity = Number(selectedType.capacity);
                const numberOfAdults = Number(formData.numberOfAdults) || 1;
                return numberOfAdults > capacity;
              })()
                ? "cursor-not-allowed"
                : "cursor-pointer"
            }`}
          />
          <label
            className={`text-sm font-medium ${
              disabled ? "text-gray-400" : "text-gray-700"
            }`}
          >
            Thêm giường phụ
            {(() => {
              const selectedType = roomTypes.find(
                (t) => t._id === formData.desiredRoomTypeId
              );
              if (selectedType && selectedType.extraBedPrice) {
                return ` (+${selectedType.extraBedPrice?.toLocaleString()}₫)`;
              }
              return "";
            })()}
          </label>
        </div>
        {(() => {
          const selectedType = roomTypes.find(
            (t) => t._id === formData.desiredRoomTypeId
          );
          if (!selectedType) return null;
          const capacity = Number(selectedType.capacity);
          const numberOfAdults = Number(formData.numberOfAdults) || 1;
          if (numberOfAdults > capacity) {
            return (
              <div className="text-xs text-orange-600 mt-1">
                Số người lớn vượt quá sức chứa phòng - Bắt buộc thêm giường phụ
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Giá mỗi đêm */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Giá mỗi đêm</label>
        <input
          type="number"
          name="pricePerNight"
          value={formData.pricePerNight}
          onChange={onChange}
          required
          readOnly={!!formData.desiredRoomTypeId}
          className={`border rounded w-full p-2 ${
            formData.desiredRoomTypeId ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          placeholder="Giá phòng mỗi đêm"
        />
        {formErrors.pricePerNight && (
          <div className="text-sm text-red-600 mt-1">
            {formErrors.pricePerNight}
          </div>
        )}
      </div>

      {/* Yêu cầu đặc biệt */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Yêu cầu đặc biệt
        </label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests}
          onChange={onChange}
          className="border rounded w-full p-2"
          placeholder="Yêu cầu đặc biệt (nếu có)"
        />
      </div>

      {/* Ghi chú nội bộ */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Ghi chú nội bộ</label>
        <textarea
          name="internalNotes"
          value={formData.internalNotes}
          onChange={onChange}
          className="border rounded w-full p-2"
          placeholder="Chỉ dành cho nhân viên"
        />
      </div>
    </>
  );
}
