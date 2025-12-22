import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function RoomsModal({ isOpen, onClose, rooms, setRooms }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [isOpen]);

  if (!isOpen) return null;

  const updateRoom = (index, field, value) => {
    setRooms((prev) =>
      prev.map((room, i) =>
        i === index
          ? {
              ...room,
              [field]: Math.max(field === "numberOfAdults" ? 1 : 0, value),
            }
          : room
      )
    );
  };

  const addRoom = () => {
    setRooms((prev) => [...prev, { numberOfAdults: 2, numberOfChildren: 0 }]);
  };

  const removeRoom = (index) => {
    if (rooms.length > 1) {
      setRooms((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleComplete = () => {
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-6 relative max-w-md mx-4 w-full"
        style={{ zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700 cursor-pointer bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          onClick={onClose}
          style={{ zIndex: 10002 }}
        >
          ×
        </button>

        <div className="flex flex-col">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
            Khách
          </h2>

          <div className="max-h-96 overflow-y-auto space-y-4 mb-6 pr-2">
            {rooms.map((room, roomIndex) => (
              <div
                key={roomIndex}
                className="border border-gray-300 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-800">
                    PHÒNG {roomIndex + 1}
                  </span>
                  {rooms.length > 1 && (
                    <button
                      onClick={() => removeRoom(roomIndex)}
                      className="text-red-600 hover:text-red-800 text-xl w-6 h-6 flex items-center justify-center"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Adults and Children - Horizontal Layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Adults */}
                  <div>
                    <span className="text-sm font-semibold text-gray-700 block mb-2">
                      Người lớn
                    </span>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <button
                        onClick={() =>
                          updateRoom(
                            roomIndex,
                            "numberOfAdults",
                            room.numberOfAdults - 1
                          )
                        }
                        className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center hover:bg-red-200 transition-colors text-lg font-bold text-red-600"
                        disabled={room.numberOfAdults <= 1}
                      >
                        -
                      </button>
                      <span className="font-bold text-xl text-gray-800">
                        {room.numberOfAdults}
                      </span>
                      <button
                        onClick={() =>
                          updateRoom(
                            roomIndex,
                            "numberOfAdults",
                            room.numberOfAdults + 1
                          )
                        }
                        className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center hover:bg-red-200 transition-colors text-lg font-bold text-red-600"
                        disabled={room.numberOfAdults >= 4}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div>
                    <span className="text-sm font-semibold text-gray-700 block mb-2">
                      Trẻ em dưới 9 tuổi
                    </span>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <button
                        onClick={() =>
                          updateRoom(
                            roomIndex,
                            "numberOfChildren",
                            room.numberOfChildren - 1
                          )
                        }
                        className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center hover:bg-red-200 transition-colors text-lg font-bold text-red-600"
                        disabled={room.numberOfChildren <= 0}
                      >
                        -
                      </button>
                      <span className="font-bold text-xl text-gray-800">
                        {room.numberOfChildren}
                      </span>
                      <button
                        onClick={() =>
                          updateRoom(
                            roomIndex,
                            "numberOfChildren",
                            room.numberOfChildren + 1
                          )
                        }
                        className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center hover:bg-red-200 transition-colors text-lg font-bold text-red-600"
                        disabled={room.numberOfChildren >= 3}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addRoom}
              className="w-full py-3 text-blue-700 hover:text-blue-900 font-bold border-2 border-dashed border-blue-400 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              + Thêm phòng
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={handleComplete}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition-colors duration-200"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}
