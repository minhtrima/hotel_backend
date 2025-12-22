import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import NotFound from "./pages/NotFound";
import Booking from "./pages/Booking";
import BookingRoom from "./pages/BookingRoom";
import BookingService from "./pages/BookingService";
import BookingCheckout from "./pages/BookingCheckout";
import VnpayReturn from "./pages/VnpayReturn";
import BookingComplete from "./pages/BookingComplete";
import PaymentSuccess from "./pages/PaymentSuccess";
import BookingLookup from "./pages/BookingLookup";
import Review from "./pages/Review";
import ReviewSubmit from "./pages/ReviewSubmit";
import RoomDetail from "./pages/RoomDetail";

function App() {
  const location = useLocation();

  // Check if current path is a booking-related page
  const isBookingPage = location.pathname.includes("booking");

  if (isBookingPage) {
    // For booking pages, don't render header at app level
    return (
      <Routes>
        <Route path="/booking/:bookingId" element={<Booking />} />
        <Route path="/booking-room/:bookingId" element={<BookingRoom />} />
        <Route
          path="/booking-service/:bookingId"
          element={<BookingService />}
        />
        <Route
          path="/booking-checkout/:bookingId"
          element={<BookingCheckout />}
        />
        <Route path="/booking/vnpay_return" element={<VnpayReturn />} />
        <Route
          path="/booking/complete/:bookingId"
          element={<BookingComplete />}
        />
        <Route path="/booking/payment-success" element={<PaymentSuccess />} />
      </Routes>
    );
  }

  // For non-booking pages, render header normally
  return (
    <>
      <Header />
      <HeroSection />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room/:roomName" element={<RoomDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/lookup" element={<BookingLookup />} />
        <Route path="/review/:bookingId" element={<ReviewSubmit />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
