import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Receipt() {
  const location = useLocation();
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    // Listen for postMessage from parent window
    const handleMessage = (event) => {
      if (
        event.origin === window.location.origin &&
        event.data.type === "RECEIPT_DATA"
      ) {
        setReceiptData(event.data.data);
        localStorage.setItem("currentReceipt", JSON.stringify(event.data.data));
      }
    };

    window.addEventListener("message", handleMessage);

    // Get receipt data from location state or localStorage
    if (location.state?.receiptData) {
      setReceiptData(location.state.receiptData);
      localStorage.setItem(
        "currentReceipt",
        JSON.stringify(location.state.receiptData)
      );
    } else {
      // Try to load from localStorage
      const saved = localStorage.getItem("currentReceipt");
      if (saved) {
        setReceiptData(JSON.parse(saved));
      }
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [location]);

  useEffect(() => {
    // Auto print after component mounts
    if (receiptData) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [receiptData]);

  if (!receiptData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Đang tải hóa đơn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-blue-600">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">HaiAu Hotel</h1>
        <p className="text-lg text-gray-600">HÓA ĐƠN THANH TOÁN</p>
      </div>

      {/* Receipt Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">
            Thông tin khách hàng
          </h3>
          <p className="text-gray-600">
            Họ tên:{" "}
            <span className="font-medium">
              {receiptData.customer.honorific} {receiptData.customer.lastName}{" "}
              {receiptData.customer.firstName}
            </span>
          </p>
          <p className="text-gray-600">
            Số điện thoại:{" "}
            <span className="font-medium">
              {receiptData.customer.phoneNumber}
            </span>
          </p>
          {receiptData.customer.email && (
            <p className="text-gray-600">
              Email:{" "}
              <span className="font-medium">{receiptData.customer.email}</span>
            </p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-3">
            Thông tin đặt phòng
          </h3>
          <p className="text-gray-600">
            Mã đặt phòng:{" "}
            <span className="font-medium">{receiptData.bookingCode}</span>
          </p>
          <p className="text-gray-600">
            Nhận phòng:{" "}
            <span className="font-medium">
              {formatDate(receiptData.checkInDate)}
            </span>
          </p>
          <p className="text-gray-600">
            Trả phòng:{" "}
            <span className="font-medium">
              {formatDate(receiptData.checkOutDate)}
            </span>
          </p>
          <p className="text-gray-600">
            Tổng số đêm:{" "}
            <span className="font-medium">{receiptData.totalNights} đêm</span>
          </p>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Chi tiết phòng</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-3 text-left">#</th>
              <th className="border border-gray-300 p-3 text-left">Số phòng</th>
              <th className="border border-gray-300 p-3 text-left">
                Loại phòng
              </th>
              <th className="border border-gray-300 p-3 text-center">Số đêm</th>
              <th className="border border-gray-300 p-3 text-right">Giá/đêm</th>
              <th className="border border-gray-300 p-3 text-right">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.rooms.map((room, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-3">{index + 1}</td>
                <td className="border border-gray-300 p-3">
                  {room.roomNumber}
                </td>
                <td className="border border-gray-300 p-3">{room.roomType}</td>
                <td className="border border-gray-300 p-3 text-center">
                  {room.nights}
                </td>
                <td className="border border-gray-300 p-3 text-right">
                  {formatCurrency(room.pricePerNight)}
                </td>
                <td className="border border-gray-300 p-3 text-right font-medium">
                  {formatCurrency(room.totalPrice)}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td colSpan="5" className="border border-gray-300 p-3 text-right">
                Tổng tiền phòng:
              </td>
              <td className="border border-gray-300 p-3 text-right">
                {formatCurrency(receiptData.roomTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Services Table */}
      {receiptData.services && receiptData.services.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Dịch vụ sử dụng</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-3 text-left">
                  Dịch vụ
                </th>
                <th className="border border-gray-300 p-3 text-center">
                  Số lượng
                </th>
                <th className="border border-gray-300 p-3 text-right">
                  Đơn giá
                </th>
                <th className="border border-gray-300 p-3 text-right">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {receiptData.services.map((service, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-3">{service.name}</td>
                  <td className="border border-gray-300 p-3 text-center">
                    {service.quantity}
                  </td>
                  <td className="border border-gray-300 p-3 text-right">
                    {formatCurrency(service.price)}
                  </td>
                  <td className="border border-gray-300 p-3 text-right font-medium">
                    {formatCurrency(service.totalPrice)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td
                  colSpan="3"
                  className="border border-gray-300 p-3 text-right"
                >
                  Tổng tiền dịch vụ:
                </td>
                <td className="border border-gray-300 p-3 text-right">
                  {formatCurrency(receiptData.servicesTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Total */}
      <div className="border-t-2 border-gray-300 pt-4 mt-6">
        <div className="flex justify-between items-center text-2xl font-bold">
          <span>TỔNG THANH TOÁN:</span>
          <span className="text-blue-600">
            {formatCurrency(receiptData.totalAmount)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-300 text-center text-gray-600">
        <p className="mb-2">🏨 Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
        <p className="mb-2">📞 Hotline: 0123-456-789</p>
        <p className="mb-4">📧 Email: contact@haiauhotel.com</p>
        <p className="text-lg font-semibold text-blue-600">
          Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!
        </p>
        <p className="text-sm mt-2">
          Rất mong được phục vụ quý khách trong những lần tới.
        </p>
      </div>

      {/* Print Button */}
      <div className="mt-8 text-center no-print">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer mr-4"
        >
          🖨️ In hóa đơn
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 cursor-pointer"
        >
          Đóng
        </button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
