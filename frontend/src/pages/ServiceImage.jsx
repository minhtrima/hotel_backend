import React, { useEffect, useState } from "react";
import ImageManagement from "../components/ImageManagement";
import { useParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import NotificationModal from "../components/NotificationModal";
import LoadingPage from "../components/Loading";
import BackArrow from "../components/BackArrow";

export default function ServiceImage() {
  const { serviceId } = useParams();
  const [images, setImages] = useState([]);
  const [serviceName, setServiceName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchServiceImages = async () => {
    try {
      const response = await fetch(`/api/service/${serviceId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      setImages(data.service.images || []);
      setServiceName(data.service.name || "");
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchServiceImages();
  }, []);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);

    const formData = new FormData();
    images.forEach((image) => {
      if (image.file) {
        formData.append("images", image.file);
        formData.append("alts", image.alt || "");
        formData.append("captions", image.caption || "");
      } else if (image.url) {
        formData.append("imageUrls", image.url);
        formData.append("alts", image.alt || "");
        formData.append("captions", image.caption || "");
      }
    });

    try {
      const response = await fetch("/api/service/" + serviceId + "/images", {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload images");
      }
      const data = await response.json();
      console.log(data);
      setNotifyMsg("Lưu ảnh dịch vụ thành công!");
      setShowNotify(true);
      setLoading(false);
    } catch (error) {
      setNotifyMsg("Có lỗi khi lưu ảnh dịch vụ!");
      setShowNotify(true);
      setLoading(false);
      console.error("Error uploading images:", error);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirm(false);
    setLoading(false);
  };

  if (loading) {
    return <LoadingPage />;
  }
  return (
    <>
      <BackArrow
        to={"/service/" + serviceId}
        text={"Quay lại loại phòng " + serviceName}
      />
      <div>
        <form onSubmit={handleSubmit}>
          <ImageManagement
            images={images}
            setImages={setImages}
            onAddImage={handleSubmit}
            title={"Quản lý ảnh cho dịch vụ " + serviceName}
          />
        </form>
        <ConfirmModal
          isOpen={showConfirm}
          message="Bạn có chắc chắn muốn lưu các thay đổi ảnh dịch vụ?"
          onConfirm={handleConfirmSubmit}
          onCancel={handleCancelSubmit}
        />
        <NotificationModal
          isOpen={showNotify}
          message={notifyMsg}
          onClose={() => setShowNotify(false)}
        />
      </div>
    </>
  );
}
