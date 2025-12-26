import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { io } from "socket.io-client";

export default function CCCDScanModal({ isOpen, onClose, onDataReceived }) {
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("loading"); // loading, waiting, success, error
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    if (!isOpen) return;

    // Create scan session
    const createSession = async () => {
      try {
        const response = await fetch("/api/cccd-scan/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();

        if (data.success) {
          setSessionId(data.sessionId);
          setStatus("waiting");
          setCountdown(data.expiresIn);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error creating scan session:", error);
        setStatus("error");
      }
    };

    createSession();

    return () => {
      setSessionId(null);
      setStatus("loading");
      setCountdown(300);
    };
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (status !== "waiting" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus("error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, countdown]);

  // Socket.IO listener
  useEffect(() => {
    if (!sessionId || status !== "waiting") return;

    console.log(
      "[CCCD Modal] Setting up Socket.IO listener for session:",
      sessionId
    );

    // Connect to backend server (adjust if needed)
    const backendUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : window.location.origin;

    console.log("[CCCD Modal] Connecting to Socket.IO at:", backendUrl);
    const socket = io(backendUrl);

    const eventName = `cccd-scanned:${sessionId}`;
    console.log("[CCCD Modal] Listening for event:", eventName);

    socket.on(eventName, (data) => {
      console.log("[CCCD Modal] Received socket event:", eventName, data);
      if (data.success) {
        setStatus("success");
        console.log("[CCCD Modal] Calling onDataReceived with:", data.data);
        onDataReceived(data.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    });

    socket.on("connect", () => {
      console.log("[CCCD Modal] Socket.IO connected");
    });

    socket.on("disconnect", () => {
      console.log("[CCCD Modal] Socket.IO disconnected");
    });

    return () => {
      console.log("[CCCD Modal] Cleaning up Socket.IO listener");
      socket.off(eventName);
      socket.disconnect();
    };
  }, [sessionId, status, onDataReceived, onClose]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quét CCCD</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {status === "loading" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang khởi tạo...</p>
          </div>
        )}

        {status === "waiting" && sessionId && (
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <QRCode
                value={JSON.stringify({
                  sessionId,
                  action: "scan-cccd",
                })}
                size={200}
              />
            </div>
            <p className="text-gray-700 mb-2 font-medium">
              Quét mã QR này bằng app điện thoại
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Mã phiên:{" "}
              <span className="font-mono">{sessionId.slice(0, 8)}...</span>
            </p>
            <div className="text-lg font-semibold text-blue-600">
              {formatTime(countdown)}
            </div>
            <p className="text-xs text-gray-500 mt-2">Thời gian còn lại</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-8">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-gray-700 font-medium">
              Đã nhận thông tin CCCD thành công!
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-8">
            <div className="text-red-500 text-5xl mb-4">✕</div>
            <p className="text-gray-700 font-medium mb-4">
              Phiên quét đã hết hạn hoặc có lỗi xảy ra
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Đóng
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            💡 Mở app HaiAu Hotel trên điện thoại, chọn "Quét CCCD" và scan mã
            QR này
          </p>
        </div>
      </div>
    </div>
  );
}
