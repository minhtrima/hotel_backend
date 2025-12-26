import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PaymentDetail from "../components/PaymentDetail";
import PaymentForm from "../components/PaymentForm";
import PaymentLog from "../components/PaymentLog";
import BackArrow from "../components/BackArrow";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

const BOOKING_STATUS_OPTIONS = [
  { value: "booked", label: "Đã đặt phòng", color: "text-yellow-600" },
  { value: "checked_in", label: "Đã nhận phòng", color: "text-blue-600" },
  { value: "completed", label: "Hoàn thành", color: "text-green-600" },
  { value: "cancelled", label: "Đã hủy", color: "text-red-600" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid", label: "Chưa thanh toán", color: "text-red-600" },
  {
    value: "partially_paid",
    label: "Đã thanh toán một phần",
    color: "text-yellow-600",
  },
  { value: "paid", label: "Đã thanh toán", color: "text-green-600" },
  { value: "refunded", label: "Đã hoàn tiền", color: "text-blue-600" },
];

export default function Payment() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentLog, setShowPaymentLog] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  useEffect(() => {
    fetchPaymentData();
    fetchPaymentsByBooking();
  }, [bookingId]);

  const handlePaymentSuccess = (paymentResult) => {
    console.log("Payment created successfully:", paymentResult);
    setShowPaymentForm(false);
    // Refresh both booking and payment data
    fetchPaymentData();
    fetchPaymentsByBooking();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
  };

  const handleSendReceipt = async () => {
    if (!booking?.customerSnapshot?.email) {
      alert("Booking không có email khách hàng để gửi hóa đơn");
      return;
    }

    const confirm = window.confirm(
      `Bạn có chắc muốn gửi hóa đơn đến ${booking.customerSnapshot.email}?`
    );
    if (!confirm) return;

    setSendingReceipt(true);
    try {
      const response = await fetch(`/api/booking/${bookingId}/send-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Lỗi khi gửi hóa đơn");
      }

      alert(`Đã gửi hóa đơn thành công đến ${booking.customerSnapshot.email}`);
    } catch (error) {
      console.error("Error sending receipt:", error);
      alert("Lỗi khi gửi hóa đơn: " + error.message);
    } finally {
      setSendingReceipt(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/booking/${bookingId}/receipt`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Lỗi khi lấy dữ liệu hóa đơn");
      }

      // Navigate to receipt page with data
      window.open(`/receipt?bookingId=${bookingId}`, "_blank");
    } catch (error) {
      console.error("Error getting receipt data:", error);
      alert("Lỗi khi xuất hóa đơn: " + error.message);
    }
  };

  const fetchPaymentData = async () => {
    try {
      const response = await fetch(`/api/booking/payment/${bookingId}`);
      if (!response.ok) {
        throw new Error("Lỗi khi lấy dữ liệu");
      }
      const data = await response.json();
      console.log(data.booking);
      setBooking(data.booking);
    } catch (error) {
      console.error("Lỗi khi tải thông tin thanh toán:", error);
      setError("Không thể tải thông tin thanh toán.");
    }
  };

  const fetchPaymentsByBooking = async () => {
    try {
      const response = await fetch(`/api/payment/booking/${bookingId}`);
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách thanh toán");
      }
      const data = await response.json();
      console.log("Payments:", data);
      setPayments(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách thanh toán:", error);
      // Don't set error here as payments might not exist yet
      setPayments([]);
    }
  };

  if (error) return <div className="text-red-600">{error}</div>;
  if (!booking) return <div>Đang tải...</div>;

  // Calculate total received from payments
  const totalReceivedFromPayments = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Calculate change (excess money), show 0 if negative
  const changeAmount = Math.max(
    0,
    totalReceivedFromPayments - (booking.totalPrice || 0)
  );

  const {
    customerSnapshot,
    status,
    paymentStatus,
    additionalServices = [],
  } = booking;

  return (
    <>
      <BackArrow to={`/booking/${bookingId}`} text="Đặt phòng" />
      <div className="max-w-xxl mx-auto mt-10 p-6 border rounded-xl shadow-md bg-white">
        <h1 className="text-2xl font-bold mb-4">Thanh Toán Đặt Phòng</h1>

        {/* Thông tin khách hàng */}
        <section className="mb-4">
          <h2 className="font-semibold">Khách hàng</h2>
          <p>
            {customerSnapshot?.honorific} {customerSnapshot?.lastName}{" "}
            {customerSnapshot?.firstName}
          </p>
          <p>Số điện thoại: {customerSnapshot?.phoneNumber}</p>
        </section>

        <p className="font-bold mb-4">
          Trạng thái đặt phòng:{" "}
          <span
            className={`
            ${
              BOOKING_STATUS_OPTIONS.find((option) => option.value === status)
                ?.color || "text-gray-600"
            }`}
          >
            {BOOKING_STATUS_OPTIONS.find((option) => option.value === status)
              ?.label || status}
          </span>
        </p>

        {/* Dịch vụ bổ sung */}
        {additionalServices.length > 0 && (
          <section className="mb-4">
            <h2 className="font-semibold">Dịch vụ bổ sung</h2>
            <ul className="list-disc list-inside">
              {additionalServices.map((s, i) => (
                <li key={i}>
                  Mã dịch vụ: {s.serviceId} x {s.quantity}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="mb-4">
          <h2 className="font-bold mb-2">Thông tin đặt phòng</h2>
          <PaymentDetail rooms={booking.rooms} />
        </section>

        {/* Thông tin dịch vụ đã sử dụng */}
        <section className="mb-4">
          <h2 className="font-bold mb-2">Thông tin dịch vụ đã sử dụng</h2>

          {(() => {
            // Collect all services from both transportation and room services
            const allServices = [];

            // Add transportation services
            if (booking.services && booking.services.length > 0) {
              booking.services.forEach((service) => {
                allServices.push({
                  name: service.serviceId?.name || service.name || "N/A",
                  price: service.serviceId?.price || service.price || 0,
                  unit: service.serviceId?.unit || service.unit || "unit",
                  quantity: service.quantity || 1,
                  type: "Tổng hợp",
                });
              });
            }

            // Add room services
            if (booking.rooms) {
              booking.rooms.forEach((room) => {
                if (
                  room.additionalServices &&
                  room.additionalServices.length > 0
                ) {
                  room.additionalServices.forEach((service) => {
                    allServices.push({
                      name: service.serviceId?.name || service.name || "N/A",
                      price: service.serviceId?.price || service.price || 0,
                      unit:
                        service.serviceId?.unitDisplay ||
                        service.unit ||
                        "phần",
                      quantity: service.quantity || 1,
                    });
                  });
                }
              });
            }

            if (allServices.length === 0) {
              return (
                <p className="text-gray-500 italic">
                  Không có dịch vụ nào được sử dụng.
                </p>
              );
            }

            return (
              <table className="min-w-full bg-white border border-gray-500 text-center border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-500">Tên dịch vụ</th>
                    <th className="border border-gray-500">Giá/đơn vị</th>
                    <th className="border border-gray-500">Số lượng</th>
                    <th className="border border-gray-500">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {allServices.map((service, index) => (
                    <tr key={index}>
                      <td className="border border-gray-500">{service.name}</td>
                      <td className="border border-gray-500">
                        {formatCurrency(service.price)}/{service.unit}
                      </td>
                      <td className="border border-gray-500">
                        {service.quantity}
                      </td>
                      <td className="border border-gray-500">
                        {formatCurrency(service.price * service.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </section>

        {/* Thông tin thanh toán */}
        <section className="mb-4">
          <h2 className="font-bold">Thông tin thanh toán</h2>
          <p>{`Tổng tiền: ${formatCurrency(booking.totalPrice)}`}</p>
          <p>Tiền đã nhận: {formatCurrency(totalReceivedFromPayments)}</p>
          <p>Tiền thừa: {formatCurrency(changeAmount)}</p>
          <p className="font-bold">
            Trạng thái thanh toán:{" "}
            <span
              className={`
            ${
              PAYMENT_STATUS_OPTIONS.find(
                (option) => option.value === paymentStatus
              )?.color || "text-gray-600"
            }`}
            >
              {PAYMENT_STATUS_OPTIONS.find(
                (option) => option.value === paymentStatus
              )?.label || paymentStatus}
            </span>
          </p>
        </section>

        {/* Action Buttons */}
        <div className="mb-4 flex justify-end gap-2">
          {booking.status === "completed" && (
            <>
              <button
                onClick={handleDownloadReceipt}
                className="px-4 py-2 bg-purple-600 text-white rounded-md cursor-pointer hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Xuất hóa đơn
              </button>
              <button
                onClick={handleSendReceipt}
                disabled={sendingReceipt || !booking?.customerSnapshot?.email}
                className="px-4 py-2 bg-orange-600 text-white rounded-md cursor-pointer hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {sendingReceipt ? "Đang gửi..." : "Gửi hóa đơn qua email"}
              </button>
            </>
          )}
          <button
            onClick={() => setShowPaymentLog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Danh sách thanh toán
          </button>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none cursor-pointer focus:ring-2 focus:ring-green-500"
          >
            Tạo thanh toán
          </button>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <PaymentForm
              bookingId={bookingId}
              totalAmount={booking.totalPrice}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}

      {/* Payment Log Modal */}
      {showPaymentLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-lg border-2 border-black shadow-lg max-w-4xl w-full max-h-[150vh] overflow-hidden">
            <PaymentLog
              payments={payments}
              onClose={() => setShowPaymentLog(false)}
              onPaymentUpdate={() => {
                fetchPaymentsByBooking();
                fetchPaymentData();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
