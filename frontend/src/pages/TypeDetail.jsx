import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AiFillEdit } from "react-icons/ai";
import TypeForm from "../components/TypeForm";
import ImageManagement from "../components/ImageManagement";
import BackArrow from "../components/BackArrow";
import LoadingPage from "../components/Loading";

export default function TypeDetail() {
  const navigate = useNavigate();
  const { typeId } = useParams();
  const [type, setType] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const amenityLabels = {
    wifi: "WiFi",
    air_conditioning: "Điều hòa",
    tv: "TV",
    minibar: "Minibar",
    balcony: "Ban công",
    sea_view: "Hướng biển",
    room_service: "Dịch vụ phòng",
    safe_box: "Két an toàn",
    coffee_maker: "Máy pha cà phê",
    hair_dryer: "Máy sấy tóc",
    bath_tub: "Bồn tắm",
    shower: "Vòi sen",
    desk: "Bàn làm việc",
    wardrobe: "Tủ quần áo",
    telephone: "Điện thoại",
    heating: "Sưởi ấm",
    kitchenette: "Bếp nhỏ",
  };

  useEffect(() => {
    const fetchTypeData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/type/${typeId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(data.message);
          return navigate("/type");
        }
        setType(data.type);
        setImages(data.type.images || []);
      } catch (err) {
        console.error("Error fetching type data:", err);
        setError("Không thể tải dữ liệu loại phòng.");
      } finally {
        setLoading(false);
      }
    };

    fetchTypeData();
  }, [navigate, typeId]);

  // Xử lý lưu ảnh
  const handleSaveImages = async () => {
    try {
      const formData = new FormData();
      images.forEach((img) => {
        if (img.file) {
          formData.append("images", img.file);
          formData.append("alts", img.alt || "");
          formData.append("captions", img.caption || "");
        } else if (img.url) {
          formData.append("imageUrls", img.url);
          formData.append("alts", img.alt || "");
          formData.append("captions", img.caption || "");
        }
      });
      const res = await fetch(`/api/type/${typeId}/images`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setType((prev) => ({ ...prev, images: data.type.images }));
        setShowImageModal(false);
      } else {
        alert("Cập nhật ảnh thất bại: " + (data.message || ""));
      }
    } catch (err) {
      console.log(err);
      alert("Có lỗi khi lưu ảnh loại phòng.");
    }
  };

  return (
    <>
      <BackArrow to="/type" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        {loading && <LoadingPage />}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold mb-6">Chi tiết loại phòng </h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 transition"
            onClick={() => navigate("/type/" + typeId + "/images")}
          >
            Quản lý ảnh
          </button>
        </div>
        <div className="relative w-full flex justify-center mt-5 pb-5">
          <div className="relative group">
            {type.images && type.images.length > 0 ? (
              <img
                src={
                  (type.images &&
                    type.images.find((img) => img.isPrimary)?.url) ||
                  (type.images && type.images[0]?.url)
                }
                alt="Type Main"
                className="rounded w-32 h-32 object-cover border"
              />
            ) : (
              <p className="text-center">Chưa có ảnh</p>
            )}

            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowImageModal(true)}
            >
              <AiFillEdit className="text-white text-2xl" />
            </button>
          </div>
        </div>
        <TypeForm type={type} />
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-5 rounded shadow-md w-full max-w-4xl">
              <h2 className="text-center text-lg font-bold mb-4">
                Quản lý ảnh loại phòng
              </h2>
              <ImageManagement
                images={images}
                setImages={setImages}
                onAddImage={handleSaveImages}
              />
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={handleSaveImages}
                >
                  Lưu ảnh
                </button>
                <button
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2"
                  onClick={() => setShowImageModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
