import React, { useState } from "react";

const PaymentForm = ({
  bookingId,
  totalAmount,
  onPaymentSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    bookingId: bookingId || "",
    amount: "",
    method: "",
    category: "",
    isDeposit: false,
    transactionCode: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Payment method options
  const PAYMENT_METHODS = [
    { value: "cash", label: "Tiền mặt (tại khách sạn)", category: "offline" },
    {
      value: "bank_transfer",
      label: "Chuyển khoản ngân hàng",
      category: "offline",
    },
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "method") {
      const selectedMethod = PAYMENT_METHODS.find((m) => m.value === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        category: selectedMethod ? selectedMethod.category : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (
        !formData.bookingId ||
        !formData.amount ||
        !formData.method ||
        !formData.category
      ) {
        throw new Error("Vui lòng điền đầy đủ thông tin bắt buộc");
      }

      if (parseFloat(formData.amount) <= 0) {
        throw new Error("Số tiền phải lớn hơn 0");
      }

      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        status: "paid", // Set status as paid when creating payment
      };

      // Create payment for all methods
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tạo thanh toán");
      }

      const result = await response.json();

      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-md bg-white">
      <h3 className="text-xl font-bold mb-4">Tạo thanh toán</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Amount */}
        <div className="mb-4">
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Số tiền thanh toán <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập số tiền"
            min="0"
            required
          />
          {totalAmount && (
            <p className="text-sm text-gray-600 mt-1">
              Tổng cần thanh toán: {formatCurrency(totalAmount)}
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <label
            htmlFor="method"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phương thức thanh toán <span className="text-red-500">*</span>
          </label>
          <select
            id="method"
            name="method"
            value={formData.method}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Chọn phương thức thanh toán</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* Is Deposit */}
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDeposit"
              name="isDeposit"
              checked={formData.isDeposit}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label
              htmlFor="isDeposit"
              className="text-sm font-medium text-gray-700"
            >
              Đây là khoản đặt cọc
            </label>
          </div>
        </div>

        {/* Transaction Code */}
        {formData.method === "bank_transfer" && (
          <div className="mb-4">
            <label
              htmlFor="transactionCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mã giao dịch
            </label>
            <input
              type="text"
              id="transactionCode"
              name="transactionCode"
              value={formData.transactionCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập mã giao dịch"
            />
          </div>
        )}

        {/* Note */}
        <div className="mb-4">
          <label
            htmlFor="note"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Ghi chú
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ghi chú thêm..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Tạo thanh toán
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
