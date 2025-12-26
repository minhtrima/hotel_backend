import React from "react";
import ServiceForm from "../components/ServiceForm";
import BackArrow from "../components/BackArrow";

export default function ServiceAdd() {
  return (
    <>
      <BackArrow to="/service" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        <h2 className="text-xl font-bold mb-6">Thêm dịch vụ</h2>
        <ServiceForm />
      </div>
    </>
  );
}
