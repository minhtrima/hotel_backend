import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Calendar from "./Calendar";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [calendarModal, setCalendarModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isBookingPage = location.pathname.includes("booking");
  const hasHeroSection = !isBookingPage; // All non-booking pages have hero section

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    if (hasHeroSection) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [hasHeroSection]);

  const navItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Loại Phòng", path: "/rooms" },
    { label: "Dịch Vụ", path: "/services" },
    { label: "Hình Ảnh", path: "/gallery" },
    { label: "Tra cứu đặt phòng", path: "/lookup" },
  ];

  const handleSubmit = async (dayStart, dayEnd) => {
    try {
      alert("a");
      const response = await fetch("/api/booking/temporary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dayStart, dayEnd }),
      });

      if (!response.ok) throw new Error("Failed to book room");

      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Booking failed");

      setCalendarModal(false);
      navigate(`/booking/${data.booking._id}`);
    } catch (error) {
      console.error("Error booking room:", error);
      alert("Đặt phòng thất bại. Vui lòng thử lại.");
    }
  };

  // Nếu đường dẫn chứa "booking", chỉ hiện logo ở giữa
  if (location.pathname.includes("booking")) {
    return (
      <header className="w-full bg-white shadow-md px-6 py-6 flex items-center justify-center">
        <div
          className="text-2xl font-bold text-blue-600 cursor-pointer"
          onClick={() => navigate("/")}
        >
          HaiAuHotel
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Floating navigation cho tất cả trang có hero section khi chưa scroll */}
      {hasHeroSection && !isScrolled && (
        <div className="fixed top-0 right-0 z-50 p-6">
          <div className="flex items-center gap-4">
            {navItems.map((item) => (
              <div
                key={item.path}
                className="text-lg text-white cursor-pointer hover:text-blue-200 drop-shadow-lg font-medium"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header chính luôn tồn tại, chỉ thay đổi visibility */}
      <header
        className={`w-full fixed top-0 left-0 z-40 bg-white shadow-md px-6 py-6 flex items-center justify-between transition-all duration-500 ease-in-out ${
          hasHeroSection
            ? isScrolled
              ? "transform translate-y-0 opacity-100"
              : "transform -translate-y-full opacity-0 pointer-events-none"
            : "transform translate-y-0 opacity-100"
        }`}
      >
        <div
          className="text-2xl font-bold text-blue-600 cursor-pointer"
          onClick={() => navigate("/")}
        >
          HaiAuHotel
        </div>
        <div className="flex items-center gap-4">
          {navItems.map((item) => (
            <div
              key={item.path}
              className="text-lg text-gray-700 cursor-pointer hover:text-blue-600"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </div>
          ))}
        </div>
      </header>
      {/* Spacer for pages without hero section */}
      {!hasHeroSection && <div className="h-20"></div>}
      <Calendar
        isOpen={calendarModal}
        onClose={() => setCalendarModal(false)}
        onSubmit={(dayStart, dayEnd) => handleSubmit(dayStart, dayEnd)}
      />
    </>
  );
}
