import React from "react";

const formatDateforInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function PaymentDetail({ rooms }) {
  return (
    <>
      <table className="min-w-full bg-white border border-gray-500 text-center border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-500">Số phòng</th>
            <th className="border border-gray-500">loại phòng</th>
            <th className="border border-gray-500">Nhận phòng</th>
            <th className="border border-gray-500">Trả phòng</th>
            <th className="border border-gray-500">Giá/đêm</th>
            <th className="border border-gray-500">Số đêm</th>
            <th className="border border-gray-500">Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, index) => {
            // Use actual dates if available, otherwise fall back to expected dates
            const checkInDate = room.actualCheckInDate
              ? new Date(room.actualCheckInDate)
              : new Date(room.expectedCheckInDate);
            const checkOutDate = room.actualCheckOutDate
              ? new Date(room.actualCheckOutDate)
              : new Date(room.expectedCheckOutDate);

            const timeDiffMs = checkOutDate.getTime() - checkInDate.getTime();
            // Calculate nights - if less than 1 day, round up to 1, minimum 1 night
            const nights = Math.max(
              1,
              Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24))
            );

            return (
              <tr key={index}>
                <td className="border border-gray-500">
                  {room.roomid?.roomNumber || "Chưa chỉ định"}
                </td>
                <td className="border border-gray-500">
                  {room.desiredRoomTypeId.name}
                </td>
                <td className="border border-gray-500">
                  {formatDateforInput(room.actualCheckInDate)}
                </td>
                <td className="border border-gray-500">
                  {formatDateforInput(room.actualCheckOutDate)}
                </td>
                <td className="border border-gray-500">
                  {room.pricePerNight.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}
                </td>
                <td className="border border-gray-500">{nights} đêm</td>
                <td className="border border-gray-500">
                  {(room.pricePerNight * nights).toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
