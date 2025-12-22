import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";

export default function VnpayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentResult, setPaymentResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        // Get all URL parameters
        const params = {};
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }

        console.log("VNPay return parameters:", params);

        // Call backend to process the payment result
        const response = await fetch(
          `/api/vnpay/vnpay-return?${searchParams.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();
        console.log("Payment processing result:", result);

        setPaymentResult(result);
        setLoading(false);

        // Auto-redirect after 5 seconds for successful payments
        if (result.success) {
          setTimeout(() => {
            navigate(`/booking/complete/${result.booking._id}`, {
              state: { paymentResult: result },
            });
          }, 3000);
        }
      } catch (error) {
        console.error("Error processing payment return:", error);
        setPaymentResult({
          success: false,
          message: "Có lỗi xảy ra khi xử lý kết quả thanh toán",
          code: "99",
        });
        setLoading(false);
      }
    };

    processPaymentReturn();
  }, [searchParams, navigate]);

  const getPaymentStatusText = (code) => {
    switch (code) {
      case "00":
        return "Thanh toán thành công";
      case "07":
        return "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)";
      case "09":
        return "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng";
      case "10":
        return "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần";
      case "11":
        return "Giao dịch không thành công do: Đã hết hạn chờ thanh toán";
      case "12":
        return "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa";
      case "13":
        return "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)";
      case "24":
        return "Giao dịch không thành công do: Khách hàng hủy giao dịch";
      case "51":
        return "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch";
      case "65":
        return "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày";
      case "75":
        return "Ngân hàng thanh toán đang bảo trì";
      case "79":
        return "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định";
      case "97":
        return "Chữ ký không hợp lệ";
      default:
        return "Giao dịch thất bại";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Đang xử lý kết quả thanh toán...
            </h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {/* Payment Status Icon */}
            <div className="mb-6">
              {paymentResult?.success ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Payment Result */}
            <h1
              className={`text-2xl font-bold mb-4 ${
                paymentResult?.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {paymentResult?.success
                ? "Thanh toán thành công!"
                : "Thanh toán thất bại!"}
            </h1>

            <p className="text-gray-600 mb-6">
              {paymentResult?.message ||
                getPaymentStatusText(paymentResult?.code)}
            </p>

            {/* Booking Information */}
            {paymentResult?.booking && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Thông tin đặt phòng
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Mã đặt phòng:</span>{" "}
                    {paymentResult.booking.bookingCode}
                  </p>
                  <p>
                    <span className="font-medium">Khách hàng:</span>{" "}
                    {paymentResult.booking.customerid?.fullName}
                  </p>
                  <p>
                    <span className="font-medium">Tổng tiền:</span>{" "}
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(paymentResult.booking.totalPrice)}
                  </p>
                  {paymentResult?.payment && (
                    <p>
                      <span className="font-medium">Số tiền thanh toán:</span>{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(paymentResult.payment.amount)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {paymentResult?.success ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Bạn sẽ được chuyển hướng đến trang xác nhận trong 3 giây...
                  </p>
                  <button
                    onClick={() =>
                      navigate(
                        `/booking/complete/${paymentResult.booking._id}`,
                        {
                          state: { paymentResult },
                        }
                      )
                    }
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                  >
                    Xem chi tiết đặt phòng
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate(-1)}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Thử lại thanh toán
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
                  >
                    Về trang chủ
                  </button>
                </>
              )}
            </div>

            {/* Technical Information */}
            {paymentResult?.code && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Mã phản hồi: {paymentResult.code}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
