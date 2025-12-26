import React, { useState } from "react";

export default function CheckOutModal({
  isOpen,
  onClose,
  rooms = [],
  onConfirm,
}) {
  const [selectedRoomIndexes, setSelectedRoomIndexes] = useState(
    rooms.map((_, idx) => idx)
  );

  if (!isOpen) return null;

  const handleToggleRoom = (idx) => {
    setSelectedRoomIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleConfirm = () => {
    // Trả về danh sách index hoặc roomid của các phòng được chọn để trả phòng
    onConfirm(selectedRoomIndexes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
        <h2 className="text-lg font-semibold mb-4">Chọn phòng để trả phòng</h2>
        <div className="mb-4 max-h-60 overflow-y-auto">
          {rooms.map((room, idx) => (
            <label key={idx} className="flex items-center mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRoomIndexes.includes(idx)}
                onChange={() => handleToggleRoom(idx)}
                className="mr-2"
                disabled={room.actualCheckOutDate}
              />
              <span>
                Phòng:{" "}
                {room.roomid?.roomNumber || room.roomid || "Chưa chỉ định"}{" "}
                {room.actualCheckOutDate && (
                  <span className="text-xs text-gray-500">(Đã trả phòng)</span>
                )}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleConfirm}
            disabled={selectedRoomIndexes.length === 0}
          >
            Xác nhận trả phòng
          </button>
        </div>
      </div>
    </div>
  );
}
