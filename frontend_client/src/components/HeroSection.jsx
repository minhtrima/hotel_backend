import React, { useState, useEffect } from "react";
import BookingWidget from "./BookingWidget";

export default function HeroSection() {
  const [bannerImages, setBannerImages] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBannerImages();
  }, []);

  // Auto slide banner images every 5 seconds
  useEffect(() => {
    if (bannerImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex(
          (prevIndex) => (prevIndex + 1) % bannerImages.length
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [bannerImages.length]);

  useEffect(() => {
    if (!bannerImages.length) return;

    const img = new Image();
    img.src = bannerImages[currentBannerIndex].url;
  }, [currentBannerIndex, bannerImages]);

  const fetchBannerImages = async () => {
    try {
      const response = await fetch("/api/images/category/banner");
      const data = await response.json();
      console.log("Fetched banner images:", data);

      if (data.success && data.data.length > 0) {
        // Sort by position để hiển thị theo thứ tự
        const sortedImages = data.data.sort((a, b) => a.position - b.position);
        setBannerImages(sortedImages);
      }
    } catch (error) {
      console.error("Error fetching banner images:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentBannerImage = () => {
    if (bannerImages.length > 0) {
      return bannerImages[currentBannerIndex];
    }
    return null;
  };

  const getBackgroundStyle = () => {
    const currentBanner = getCurrentBannerImage();

    if (currentBanner) {
      const imageUrl = currentBanner.url.startsWith("http")
        ? currentBanner.url
        : `${import.meta.env.VITE_API_BASE_URL}/${currentBanner.url}`;

      return {
        backgroundImage: `url("${imageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }

    return {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    };
  };

  return (
    <div className="relative w-full h-screen">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={getBackgroundStyle()}
      >
        {!loading && bannerImages.length > 0 && (
          <>
            <img
              src={getCurrentBannerImage().url}
              className="absolute inset-0 w-full h-full object-cover"
              alt="Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black from-0% via-transparent via-50% to-black to-100% bg-opacity-60" />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
        {/* Hotel Title */}
        <div className="mb-8">
          <h1
            className="text-6xl md:text-8xl font-bold mb-4 text-blue-600"
            style={{
              textShadow:
                "4px 4px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            HaiAuHotel
          </h1>
        </div>

        {/* Booking Widget */}
        <div className="w-full max-w-6xl">
          <BookingWidget />
        </div>

        {/* Banner indicators */}
        {bannerImages.length > 1 && (
          <div className="flex space-x-2 mt-8">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBannerIndex(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 border-2 border-white ${
                  index === currentBannerIndex
                    ? "bg-white"
                    : "bg-transparent hover:bg-white hover:bg-opacity-50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
