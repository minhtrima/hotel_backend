import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BookingSidebar from "../components/BookingSidebar";
import Header from "../components/Header";
import Select from "react-select";
import { getData } from "country-list";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// fetch booking data by ID
const fetchBookingData = async (bookingId) => {
  try {
    const response = await fetch(`/api/booking/${bookingId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch booking data");
    }
    const data = await response.json();
    return data.booking;
  } catch (error) {
    console.error("Error fetching booking data:", error);
    return null;
  }
};

// Booking Checkout Page
export default function BookingCheckout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    honorific: "Ông",
    phoneNumber: "",
    nationality: "Viet Nam",
  });
  const [formErrors, setFormErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("hotel"); // "hotel" or "vnpay"
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState("VN");

  // Get country list
  const countryOptions = getData().map((country) => ({
    value: country.name,
    label: country.name,
  }));

  const vietnamOption = { value: "Viet Nam", label: "Việt Nam" };
  const sortedCountryOptions = [
    vietnamOption,
    ...countryOptions
      .filter((option) => option.value !== "Viet Nam")
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
  //

  const handleNationalityChange = (selectedOption) => {
    const countryName = selectedOption ? selectedOption.value : "";

    setFormData((prev) => ({
      ...prev,
      nationality: countryName,
    }));

    // AUTO-CHANGE PHONE COUNTRY
    const country = getData().find((c) => c.name === countryName);

    if (country && country.code) {
      setSelectedPhoneCountry(country.code); // ISO2 code (e.g. VN, US, JP)
    }

    // Clear error
    if (formErrors.nationality) {
      setFormErrors((prev) => ({ ...prev, nationality: "" }));
    }
  };

  const handlePhoneChange = (value) => {
    let cleanedValue = value;

    if (value) {
      cleanedValue = value.replace(/(\+\d{1,3})\s*0+(\d)/, "$1 $2");
    }

    setFormData((prev) => ({
      ...prev,
      phoneNumber: cleanedValue || "",
    }));

    if (formErrors.phoneNumber) {
      setFormErrors((prev) => ({ ...prev, phoneNumber: "" }));
    }
  };

  // input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    console.log("Form data updated:", { formData });

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  //

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "Tên không được để trống";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Họ không được để trống";
    }

    if (!formData.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!formData.phoneNumber || formData.phoneNumber.trim() === "") {
      errors.phoneNumber = "Số điện thoại không được để trống";
    } else if (formData.phoneNumber.length < 10) {
      errors.phoneNumber = "Số điện thoại không hợp lệ";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      console.log("Submitting form data:", formData);
      const customerResponse = await fetch("/api/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!customerResponse.ok) {
        console.log(
          "Failed to save customer data:",
          customerResponse.statusText
        );
        throw new Error("Failed to save customer data");
      }
      const data = await customerResponse.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to save customer data");
      }
      console.log("Customer data saved successfully:", data.customer);

      const bookingResponse = await fetch(
        `/api/booking/confirm-booking/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: data.customer._id,
            method: paymentMethod,
          }),
        }
      );

      if (!bookingResponse.ok) {
        throw new Error("Failed to update booking");
      }
      const bookingData = await bookingResponse.json();
      if (!bookingData.success) {
        alert(bookingData.message || "Failed to update booking");
        throw new Error(bookingData.message || "Failed to update booking");
      }

      // Handle payment method
      if (paymentMethod === "hotel") {
        const manualResponse = await fetch("/api/payment/manual-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: bookingId,
            method: "hotel",
          }),
        });
        if (!manualResponse.ok) {
          throw new Error("Failed to create manual payment record");
        }
        const manualData = await manualResponse.json();
        if (!manualData.success) {
          throw new Error(
            manualData.message || "Failed to create manual payment record"
          );
        }
        const updatedBooking = await fetchBookingData(bookingId);
        navigate(`/booking/complete/${updatedBooking.bookingCode}`);
        return;
      } else if (paymentMethod === "vnpay") {
        // Redirect to VNPAY payment using payment controller
        const vnpayResponse = await fetch(`/api/payment/vnpay-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: bookingId,
          }),
        });
        console.log("VNPAY response:", vnpayResponse);
        if (vnpayResponse.ok) {
          const vnpayData = await vnpayResponse.json();
          console.log("VNPAY data:", vnpayData);
          if (vnpayData.success && vnpayData.vnpayUrl) {
            // Redirect to VNPAY
            window.location.href = vnpayData.vnpayUrl;
            return;
          } else {
            console.error("VNPay payment failed:", vnpayData.message);
            alert(`Không thể tạo thanh toán VNPay: ${vnpayData.message}`);
          }
        } else {
          const errorData = await vnpayResponse.json();
          console.error("VNPay request failed:", errorData);
          alert(`Lỗi khi tạo thanh toán: ${errorData.message}`);
        }
        // If VNPAY fails, fallback to hotel payment
        alert(
          "Không thể kết nối đến VNPAY. Vui lòng thanh toán tại khách sạn."
        );
      }

      console.log("Booking updated successfully:", bookingData.booking);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Có lỗi xảy ra khi lưu thông tin!");
    }
  };

  useEffect(() => {
    fetchBookingData(bookingId)
      .then((data) => {
        if (data) {
          setBooking(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching booking data:", error);
      });
  }, [bookingId]);

  const getTotalPrice = () => {
    if (!booking) return 0;
    const totalRoomPrice = booking.rooms.reduce((total, room) => {
      total += room.pricePerNight || 0;
      return total;
    }, 0);

    const totalServicePrice = booking.services.reduce((total, service) => {
      total += (service.price || 0) * (service.quantity || 0);
      return total;
    }, 0);

    const totalNights = booking
      ? Math.ceil(
          (new Date(booking.expectedCheckOutDate) -
            new Date(booking.expectedCheckInDate)) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    return totalNights * totalRoomPrice + totalServicePrice;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <div className="bg-white p-6 rounded max-w-4xl mx-auto">
            <h1 className="text-3xl font-semibold mb-6">
              Thông tin người đặt phòng
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Danh xưng, Họ và Tên */}
              <div className="flex gap-4">
                {/* Danh xưng */}
                <div className="flex-shrink-0 w-24">
                  <label className="block text-sm font-medium mb-1">
                    Danh xưng
                  </label>
                  <select
                    name="honorific"
                    value={formData.honorific}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <option value="Ông">Ông</option>
                    <option value="Bà">Bà</option>
                  </select>
                  {formErrors.honorific && (
                    <div className="text-sm text-red-600 mt-1">
                      {formErrors.honorific}
                    </div>
                  )}
                </div>

                {/* Họ */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Họ</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors    "
                    placeholder="Nhập họ"
                  />
                  {formErrors.lastName && (
                    <div className="text-sm text-red-600 mt-1">
                      {formErrors.lastName}
                    </div>
                  )}
                </div>

                {/* Tên */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Tên</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors"
                    placeholder="Nhập tên"
                  />
                  {formErrors.firstName && (
                    <div className="text-sm text-red-600 mt-1">
                      {formErrors.firstName}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors"
                  placeholder="Nhập email"
                />
                {formErrors.email && (
                  <div className="text-sm text-red-600 mt-1">
                    {formErrors.email}
                  </div>
                )}
              </div>

              {/* Quốc tịch */}
              <div className="flex gap-4">
                <div className="w-[400px]">
                  <label className="block text-sm font-medium mb-1">
                    Quốc tịch
                  </label>
                  <Select
                    name="nationality"
                    value={
                      sortedCountryOptions.find(
                        (option) => option.value === formData.nationality
                      ) || null
                    }
                    onChange={handleNationalityChange}
                    options={sortedCountryOptions}
                    placeholder="Chọn quốc tịch"
                    isSearchable
                    className="react-select-container cursor-pointer"
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        border: "1px solid #d1d5db",
                        borderRadius: "0.375rem",
                        padding: "0.125rem",
                        minHeight: "2.5rem",
                        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                        cursor: "pointer",
                        boxShadow: state.isFocused
                          ? "0 0 0 1px #3b82f6"
                          : "none",
                        "&:hover": {
                          borderColor: "#9ca3af",
                        },
                      }),
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9999,
                      }),
                    }}
                  />
                  {formErrors.nationality && (
                    <div className="text-sm text-red-600 mt-1">
                      {formErrors.nationality}
                    </div>
                  )}
                </div>
                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số điện thoại
                  </label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry={selectedPhoneCountry}
                    country={selectedPhoneCountry}
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="Nhập số điện thoại"
                    className="phone-input-container w-50 "
                    style={{
                      "--PhoneInput-color--focus": "#3b82f6",
                      "--PhoneInputCountrySelect-marginRight": "0.5rem",
                    }}
                  />
                  {formErrors.phoneNumber && (
                    <div className="text-sm text-red-600 mt-1">
                      {formErrors.phoneNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-10 items-end">
                <h3 className="font-bold text-lg">Tổng tiền</h3>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    currencyDisplay: "code",
                  }).format(getTotalPrice())}
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-4">
                  Chọn phương thức thanh toán
                </h3>
                <div className="space-y-3">
                  {/* Hotel Payment Option */}
                  <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      id="hotel-payment"
                      name="paymentMethod"
                      value="hotel"
                      checked={paymentMethod === "hotel"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="hotel-payment"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600">
                            💳
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Thanh toán tại khách sạn
                          </div>
                          <div className="text-sm text-gray-600">
                            Thanh toán bằng tiền mặt hoặc thẻ khi nhận phòng
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* VNPAY Payment Option */}
                  <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      id="vnpay-payment"
                      name="paymentMethod"
                      value="vnpay"
                      checked={paymentMethod === "vnpay"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="vnpay-payment"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            VNP
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Thanh toán VNPAY
                          </div>
                          <div className="text-sm text-gray-600">
                            Thanh toán trực tuyến qua thẻ ngân hàng, ví điện tử
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
                >
                  {paymentMethod === "vnpay"
                    ? "Thanh toán VNPAY"
                    : "Xác nhận đặt phòng"}
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition cursor-pointer"
                  onClick={() => window.history.back()}
                >
                  Quay lại
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <BookingSidebar booking={booking} />
    </div>
  );
}
