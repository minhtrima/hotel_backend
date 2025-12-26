import React, { useState } from "react";
import ConfirmModal from "./ConfirmModal";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

const formatDate = (date) => {
  if (!date) return "Chưa có";
  const d = new Date(date);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PAYMENT_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

const PAYMENT_METHOD_LABELS = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  vnpay: "VNPAY",
};

export default function PaymentLog({ payments, onClose, onPaymentUpdate }) {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    paymentId: null,
    newStatus: null,
    message: "",
  });

  const handleStatusChange = (paymentId, newStatus) => {
    let message = "";
    switch (newStatus) {
      case "paid":
        message = "Bạn có chắc chắn muốn xác nhận thanh toán này?";
        break;
      case "failed":
        message = "Bạn có chắc chắn muốn hủy thanh toán này?";
        break;
      case "refunded":
        message = "Bạn có chắc chắn muốn hoàn tiền cho thanh toán này?";
        break;
      default:
        message = "Bạn có chắc chắn muốn thay đổi trạng thái thanh toán này?";
    }

    setConfirmModal({
      isOpen: true,
      paymentId,
      newStatus,
      message,
    });
  };

  const handleConfirmStatusChange = async () => {
    if (confirmModal.paymentId && confirmModal.newStatus) {
      await updatePaymentStatus(confirmModal.paymentId, confirmModal.newStatus);
    }
    setConfirmModal({
      isOpen: false,
      paymentId: null,
      newStatus: null,
      message: "",
    });
  };

  const handleCancelStatusChange = () => {
    setConfirmModal({
      isOpen: false,
      paymentId: null,
      newStatus: null,
      message: "",
    });
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const response = await fetch(`/api/payment/${paymentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }

      const updatedPayment = await response.json();
      console.log("Payment status updated:", updatedPayment);

      // Call parent function to refresh payments
      if (onPaymentUpdate) {
        onPaymentUpdate();
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái thanh toán");
    }
  };

  if (!payments || payments.length === 0) {
    return (
      <div className="max-h-[600px] overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-white z-10">
          <h2 className="text-xl font-bold">Danh sách thanh toán</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-500 text-center py-8">
            Chưa có thanh toán nào cho đặt phòng này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-y-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-white z-10">
        <h2 className="text-xl font-bold">Danh sách thanh toán</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <div
              key={payment._id || index}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        PAYMENT_STATUS_COLORS[payment.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Phương thức:{" "}
                    {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                  </p>
                  {payment.isDeposit && (
                    <p className="text-sm text-blue-600 font-medium">Đặt cọc</p>
                  )}

                  <div className="text-sm text-gray-500 space-y-1 mt-2">
                    <p>Tạo: {formatDate(payment.createdAt)}</p>
                    {payment.paidAt && (
                      <p>Thanh toán: {formatDate(payment.paidAt)}</p>
                    )}
                    {payment.transactionCode && (
                      <p>Mã GD: {payment.transactionCode}</p>
                    )}
                    {payment.note && (
                      <p className="text-gray-700">Ghi chú: {payment.note}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons on the right */}
                <div className="flex flex-col gap-2">
                  {payment.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(payment._id, "paid")}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded cursor-pointer hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 whitespace-nowrap"
                      >
                        Xác nhận thanh toán
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(payment._id, "failed")
                        }
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded cursor-pointer hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Hủy thanh toán
                      </button>
                    </>
                  )}
                  {payment.status === "paid" && (
                    <button
                      onClick={() =>
                        handleStatusChange(payment._id, "refunded")
                      }
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Hoàn tiền
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t bg-white rounded-lg p-3">
          <h3 className="font-medium mb-2">Tổng kết</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Tổng số giao dịch:</span>
              <span>{payments.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Đã thanh toán:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(
                  payments
                    .filter((p) => p.status === "paid")
                    .reduce((sum, p) => sum + (p.amount || 0), 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Đang chờ:</span>
              <span className="font-medium text-yellow-600">
                {formatCurrency(
                  payments
                    .filter((p) => p.status === "pending")
                    .reduce((sum, p) => sum + (p.amount || 0), 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
      />
    </div>
  );
}
