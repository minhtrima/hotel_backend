import React from "react";
import TypeForm from "../components/TypeForm";
import BackArrow from "../components/BackArrow";

export default function TypeAdd() {
  return (
    <>
      <BackArrow to="/type" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        <h2 className="text-xl font-bold mb-6">Thêm loại phòng</h2>
        <TypeForm />
      </div>
    </>
  );
}
