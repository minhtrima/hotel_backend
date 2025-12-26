import React from "react";
import { FaTrash } from "react-icons/fa";

export default function ServicesForBookingDetail({
  services = [],
  index,
  onRemove,
  onChangeQuantity,
  isForEachRoom = false,
}) {
  if (!services.length) {
    return (
      <div className="text-gray-400 italic text-sm mb-2">
        {isForEachRoom
          ? "Chưa có dịch vụ nào cho phòng này."
          : "Chưa có dịch vụ tổng hợp nào."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-2">
      <table className="min-w-[300px] w-full border border-gray-200 rounded shadow text-sm">
        <thead>
          <tr className="bg-blue-50">
            <th className="py-2 px-3 border-b text-left font-semibold">
              Tên dịch vụ
            </th>
            <th className="py-2 px-3 border-b text-left font-semibold">Giá</th>
            <th className="py-2 px-3 border-b text-left font-semibold">
              Số lượng
            </th>
            <th className="py-2 px-3 border-b text-center font-semibold w-10">
              {/* Xóa */}
            </th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, idx) => (
            <tr key={idx} className="even:bg-gray-50">
              <td className="py-2 px-3 border-b">{service.name}</td>
              <td className="py-2 px-3 border-b">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(service.price)}
                /{service.unitDisplay}
              </td>
              <td className="py-2 px-3 border-b">
                <input
                  type="number"
                  className="w-16 border rounded px-2"
                  value={service.quantity || 1}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value, 10);
                    if (newQuantity > 0) {
                      onChangeQuantity &&
                        onChangeQuantity(index, idx, newQuantity);
                    }
                  }}
                />
              </td>
              <td className="py-2 px-3 border-b text-center">
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                  onClick={() => onRemove && onRemove(index, idx)}
                  title="Xóa dịch vụ"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
