import React, { useState } from "react";

export default function ImageInput({ isOpen, onClose, onSave }) {
  const [img, setImg] = useState({
    url: "",
    alt: "",
    caption: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setImg((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Xử lý upload file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Tạo url tạm để xem trước ảnh
      const url = URL.createObjectURL(file);
      setImg((prev) => ({
        ...prev,
        url,
        file, // Lưu file nếu cần upload lên server sau này
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(img);
    setImg({
      url: "",
      alt: "",
      caption: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1100]">
      <div
        className="fixed inset-0 bg-black opacity-10 z-[1000] pointer-events-auto"
        onClick={onClose}
      ></div>
      <div
        className="bg-white p-6 rounded shadow-2xl max-w-xl w-full relative flex flex-col items-center pointer-events-auto z-[1101]"
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
        <h2 className="text-xl font-bold mb-6 text-center">Thêm ảnh</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-base font-semibold mb-1 block">
              URL ảnh
            </label>
            <input
              type="text"
              name="url"
              className="border rounded p-1 w-full"
              placeholder="URL ảnh"
              value={img.url}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="text-base font-semibold mb-1 block">
              Hoặc tải ảnh lên
            </label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {img.url && (
              <img
                src={img.url}
                alt={img.alt || ""}
                className="w-32 h-32 object-cover rounded border mt-2"
              />
            )}
          </div>
          <div>
            <label className="text-base font-semibold mb-1 block">Alt</label>
            <input
              type="text"
              name="alt"
              className="border rounded p-1 w-full"
              placeholder="Alt"
              value={img.alt}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="text-base font-semibold mb-1 block">
              Chú thích
            </label>
            <input
              type="text"
              name="caption"
              className="border rounded p-1 w-full"
              placeholder="Chú thích"
              value={img.caption}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-2 rounded cursor-pointer"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
              onClick={handleSubmit}
            >
              Thêm ảnh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
