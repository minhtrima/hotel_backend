import React, { useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ImageModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  title,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate("prev");
      if (e.key === "ArrowRight") onNavigate("next");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-full w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-10"
          aria-label="Close"
        >
          <FaTimes className="w-8 h-8" />
        </button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => onNavigate("prev")}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors duration-200 z-10 bg-black bg-opacity-50 rounded-full p-3"
              aria-label="Previous image"
            >
              <FaChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => onNavigate("next")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors duration-200 z-10 bg-black bg-opacity-50 rounded-full p-3"
              aria-label="Next image"
            >
              <FaChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Main image */}
        <img
          src={currentImage.url}
          alt={currentImage.alt || currentImage.title || title}
          className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
        />

        {/* Image info */}
        {(currentImage.title ||
          currentImage.description ||
          currentImage.caption) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent text-white p-6 rounded-b-lg">
            {currentImage.title && (
              <h3 className="text-xl font-bold mb-2">{currentImage.title}</h3>
            )}
            {(currentImage.description || currentImage.caption) && (
              <p className="text-gray-300">
                {currentImage.description || currentImage.caption}
              </p>
            )}
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
