import React, { useState } from "react";
import ImageInput from "./ImageInput";
import ImageSlideshow from "./ImageSlideshow";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FaTrash } from "react-icons/fa";
import { FaExpand } from "react-icons/fa";

const ItemType = { IMAGE: "image" };

function DraggableImage({ img, idx, moveImage, removeImage, onExpand }) {
  const imgRef = React.useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.IMAGE,
    item: () => ({ idx }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType.IMAGE,
    hover: (item) => {
      if (item.idx !== idx) {
        moveImage(item.idx, idx);
        item.idx = idx;
      }
    },
  });

  // Set custom drag image on drag start
  const handleDragStart = (e) => {
    if (imgRef.current) {
      e.dataTransfer.setDragImage(imgRef.current, 64, 64);
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className="relative flex flex-col items-center cursor-move group"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="relative">
        <img
          ref={imgRef}
          src={img.url}
          alt={img.alt || ""}
          className="w-32 h-32 object-cover rounded border"
          draggable
          onDragStart={handleDragStart}
        />
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="bg-white bg-opacity-80 rounded-full w-6 h-6 flex items-center justify-center text-blue-500 hover:text-blue-700 shadow text-xs cursor-pointer"
            title="Mở rộng"
            style={{ lineHeight: 1 }}
            onClick={() => onExpand(idx)}
          >
            <FaExpand className="" />
          </button>
          <button
            type="button"
            className="bg-white bg-opacity-80 rounded-full w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 shadow text-xs cursor-pointer"
            onClick={() => removeImage(idx)}
            title="Xóa ảnh"
            style={{ lineHeight: 1 }}
          >
            <FaTrash className="text-md" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImageManagement({
  images = [],
  setImages,
  onAddImage,
  title = "Quản lý ảnh",
}) {
  const [showModal, setShowModal] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  // Xử lý lưu ảnh mới
  const handleSaveImage = (img) => {
    setImages([...images, img]);
    setShowModal(false);
  };

  // Di chuyển ảnh trong danh sách
  const moveImage = (from, to) => {
    if (from === to) return;
    const updated = [...images];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setImages(updated);
  };

  // Xóa ảnh
  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  // Mở slideshow tại ảnh được chọn
  const handleExpand = (idx) => {
    setSlideshowIndex(idx);
    setSlideshowOpen(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white p-10 rounded shadow-lg max-w-6xl w-full mx-auto mt-10 relative">
        <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>
        {/* Danh sách ảnh */}
        <div className="mb-8">
          {images && images.length > 0 ? (
            <div className="flex flex-row flex-wrap gap-8 justify-start">
              {images.map((img, idx) => (
                <DraggableImage
                  key={idx}
                  img={img}
                  idx={idx}
                  moveImage={moveImage}
                  removeImage={removeImage}
                  onExpand={handleExpand}
                />
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center">Chưa có ảnh nào.</div>
          )}
        </div>
        <div className="flex justify-between ">
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setShowModal(true)}
          >
            Thêm ảnh
          </button>
          <button
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={onAddImage}
          >
            Áp dụng
          </button>
        </div>
        {/* Overlay to block interaction when modal open */}
        <ImageInput
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveImage}
        />
        <ImageSlideshow
          isOpen={slideshowOpen}
          onClose={() => setSlideshowOpen(false)}
          images={images}
          selectedIndex={slideshowIndex}
        />
      </div>
    </DndProvider>
  );
}
