import React, { useState, useEffect, useRef } from "react";
import { GrPrevious, GrNext } from "react-icons/gr";

export default function ImageSlideshow({
  isOpen,
  onClose,
  images = [],
  selectedIndex = 0,
}) {
  const [selectedImage, setSelectedImage] = useState(selectedIndex);
  const thumbsRef = useRef([]);
  const thumbsContainerRef = useRef(null);

  useEffect(() => {
    setSelectedImage(selectedIndex);
  }, [selectedIndex, isOpen]);

  // Scroll selected thumbnail to center
  useEffect(() => {
    if (thumbsRef.current[selectedImage] && thumbsContainerRef.current) {
      const thumb = thumbsRef.current[selectedImage];
      const container = thumbsContainerRef.current;

      const scrollLeft =
        thumb.offsetLeft -
        container.offsetLeft -
        container.clientWidth / 2 +
        thumb.clientWidth / 2;
      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [selectedImage, images.length, isOpen]);

  if (!isOpen || images.length === 0) return null;

  const handlePrev = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1100]">
      {/* Overlay: click to close */}
      <div
        className="fixed inset-0 bg-black opacity-10 z-[1000] pointer-events-auto"
        onClick={onClose}
      ></div>
      {/* Modal content: stop propagation */}
      <div
        className="bg-white p-6 rounded shadow-2xl max-w-4xl w-full relative flex flex-col items-center pointer-events-auto z-[1101]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-red-600 me-3 cursor-pointer"
          onClick={onClose}
          title="Đóng"
        >
          ×
        </button>
        <h1 className="text-2xl font-bold mb-4">Thư viện ảnh</h1>
        <div className="flex items-center justify-center w-full mb-4">
          {/* Prev button - outside left */}
          <button
            type="button"
            onClick={handlePrev}
            className="text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-80 hover:bg-blue-100 text-gray-500 hover:text-blue-600 shadow z-10 mr-2 cursor-pointer"
            aria-label="Previous"
            style={{ flex: "none" }}
          >
            <GrPrevious />
          </button>
          {/* Image box with fixed max width */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: "600px",
              height: "400px",
              background: "#f9f9f9",
              borderRadius: "0.5rem",
              boxShadow: "0 2px 8px #0001",
            }}
          >
            <img
              src={images[selectedImage].url}
              alt={images[selectedImage].alt || ""}
              className="object-contain rounded"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                display: "block",
                margin: "auto",
              }}
            />
          </div>
          {/* Next button - outside right */}
          <button
            type="button"
            onClick={handleNext}
            className="text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-80 hover:bg-blue-100 text-gray-500 hover:text-blue-600 shadow z-10 ml-2 cursor-pointer"
            aria-label="Next"
            style={{ flex: "none" }}
          >
            <GrNext />
          </button>
        </div>
        {/* Thumbnail slideshow */}
        <div
          className="flex gap-2 mt-2 overflow-x-auto max-w-full"
          ref={thumbsContainerRef}
          style={{
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
          }}
        >
          {images.map((img, idx) => (
            <img
              key={idx}
              ref={(el) => (thumbsRef.current[idx] = el)}
              src={img.url}
              alt={img.alt || ""}
              className={`w-16 h-16 object-cover rounded border cursor-pointer transition-all ${
                idx === selectedImage
                  ? "border-blue-600 ring-2 ring-blue-400"
                  : "border-gray-300 opacity-70 hover:opacity-100"
              }`}
              onClick={() => setSelectedImage(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
