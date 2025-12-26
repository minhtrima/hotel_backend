import React from "react";

export default function NotificationModal({
  title = "Thông báo",
  message,
  isOpen,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center pb-5">
          {title}
        </h1>
        <p className="text-gray-800 mb-4 ">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
