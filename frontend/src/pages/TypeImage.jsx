import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ImageManagement from "../components/ImageManagement";
import LoadingPage from "../components/Loading";
import NotificationModal from "../components/NotificationModal";
import ConfirmModal from "../components/ConfirmModal";
import BackArrow from "../components/BackArrow";

export default function TypeImage() {
  const { typeId } = useParams();

  const [images, setImages] = useState([]);
  const [typeName, setTypeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Rollback location, set to type overview page
  const rollbackLocation = "/type/" + typeId;

  useEffect(() => {
    async function fetchType() {
      setLoading(true);
      try {
        const res = await fetch(`/api/type/${typeId}`);
        if (!res.ok) throw new Error("Không tìm thấy loại phòng");
        const data = await res.json();
        setTypeName(data.type.name || "");
        setImages(data.type.images || []);
        console.log("data", data);
      } catch (err) {
        console.log("Đã có lỗi xảy ra:", err);
        setNotifyMsg("Không thể tải dữ liệu loại phòng!");
        setShowNotify(true);
      }
      setLoading(false);
    }
    fetchType();
  }, [typeId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    images.forEach((image) => {
      if (image.file) {
        formData.append("files", image.file);
        formData.append("alts", image.alt || "");
        formData.append("captions", image.caption || "");
      } else if (image.url) {
        formData.append("imageUrls", image.url);
        formData.append("alts", image.alt || "");
        formData.append("captions", image.caption || "");
      }
    });

    try {
      const response = await fetch(`/api/type/${typeId}/images`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload images");
      }
      const data = await response.json();
      console.log("Images saved successfully:", data);
      setNotifyMsg("Lưu ảnh loại phòng thành công!");
      setShowNotify(true);
    } catch (error) {
      console.error("Error saving images:", error);
      setNotifyMsg("Lưu ảnh loại phòng thất bại!");
      setShowNotify(true);
    }
    setLoading(false);
    setShowConfirm(false);
  };

  const handleCancelSubmit = () => {
    setShowConfirm(false);
    setLoading(false);
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <BackArrow to={rollbackLocation} />
      <form onSubmit={handleSubmit}>
        <ImageManagement
          images={images}
          setImages={setImages}
          onAddImage={handleSubmit}
          title={"Quản lý ảnh cho loại phòng " + typeName}
        />
      </form>
      <ConfirmModal
        isOpen={showConfirm}
        message="Bạn có chắc chắn muốn lưu các thay đổi ảnh loại phòng?"
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />
      <NotificationModal
        isOpen={showNotify}
        message={notifyMsg}
        onClose={() => setShowNotify(false)}
      />
    </div>
  );
}
