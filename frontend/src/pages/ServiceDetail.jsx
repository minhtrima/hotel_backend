import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServiceForm from "../components/ServiceForm";
import ImageModal from "../components/ImageManagement";
import { IoIosArrowRoundBack } from "react-icons/io";
import BackArrow from "../components/BackArrow";

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const [service, setService] = useState({});
  const navigate = useNavigate();

  const fetchServiceData = async () => {
    const response = await fetch(`/api/service/${serviceId}`);
    if (!response.ok) throw new Error("Failed to fetch service data");

    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch service data");

    return data.service;
  };

  useEffect(() => {
    fetchServiceData()
      .then((data) => {
        setService(data);
      })
      .catch((err) => {
        console.error("Failed to load service:", err);
      });
  }, [serviceId]);

  return (
    <>
      <BackArrow to="/service" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold mb-6">Chi tiết dịch vụ</h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 transition"
            onClick={() => navigate("/service/" + serviceId + "/images")}
          >
            Quản lý ảnh
          </button>
        </div>
        <ServiceForm service={service} />
      </div>
    </>
  );
}
