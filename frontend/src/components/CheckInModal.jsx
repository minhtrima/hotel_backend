import React, { useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal";

export default function CheckInModal({
  isOpen,
  onClose,
  typeId,
  roomId,
  onSelectRoom,
  roomsToCheckIn = 1, // NEW: number of rooms to select
}) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchRoom = async () => {
    const response = await fetch(`/api/room`);
    if (!response.ok) throw new Error("Failed to fetch room data");

    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch room data");

    return data.rooms;
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoom()
        .then((rooms) => {
          setRooms(rooms);
          // Preselect rooms if possible
          setSelectedRoomIds(
            rooms
              .filter((room) => !typeId || room.typeid?._id === typeId)
              .slice(0, roomsToCheckIn)
              .map((room) => room._id)
          );
        })
        .catch((error) => {
          console.error("Error fetching room data:", error);
        });
    }
  }, [isOpen, typeId, roomsToCheckIn]);

  const handleOpenConfirm = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (onSelectRoom) {
      onSelectRoom(selectedRoomIds);
    }
    setIsConfirmOpen(false);
    onClose();
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
  };

  const handleRoomSelect = (idx, value) => {
    const updated = [...selectedRoomIds];
    updated[idx] = value;
    setSelectedRoomIds(updated);
  };

  if (!isOpen) return null;
  return (
    <>
      {/* Check-In Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 text-center pb-5">
            Nhận phòng
          </h2>
          <div>
            {[...Array(roomsToCheckIn)].map((_, idx) => (
              <div key={idx} className="mb-3">
                <label className="block text-sm font-medium bold">
                  Chọn phòng {roomsToCheckIn > 1 ? idx + 1 : ""}:
                </label>
                <select
                  value={selectedRoomIds[idx] || ""}
                  onChange={(e) => handleRoomSelect(idx, e.target.value)}
                  className="w-full border border-black rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms
                    // Lọc phòng chỉ lấy phòng có status "available"
                    .filter((room) => {
                      const currentTypeId = Array.isArray(typeId)
                        ? typeId[idx]
                        : typeId;
                      const isSelectedElsewhere = selectedRoomIds.some(
                        (selectedId, i) =>
                          i !== idx &&
                          selectedId === room._id &&
                          (Array.isArray(typeId)
                            ? typeId[i] === currentTypeId
                            : true)
                      );
                      return (
                        room.typeid?._id === currentTypeId &&
                        room.status === "available" && // chỉ lấy phòng còn trống
                        !isSelectedElsewhere
                      );
                    })
                    .map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.roomNumber} - {room.typeid?.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <button
              onClick={handleOpenConfirm}
              className="w-50 bg-blue-600 text-white font-medium py-3 px-4 mt-5 rounded-lg shadow-lg
              hover:bg-blue-700 cursor-pointer transition-colors duration-300 me-5"
              disabled={selectedRoomIds.some((id) => !id)}
            >
              Xác nhận nhận phòng
            </button>
            <button
              onClick={onClose}
              className="w-30 bg-blue-600 text-white font-medium py-3 px-4 mt-5 rounded-lg shadow-lg
              hover:bg-blue-700 cursor-pointer transition-colors duration-300"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        message="Bạn có chắc chắn muốn nhận phòng này?"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </>
  );
}
