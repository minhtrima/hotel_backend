import React from "react";
import StaffForm from "../components/StaffForm";
import BackArrow from "../components/BackArrow";

export default function StaffAdd() {
  return (
    <>
      <BackArrow to="/staff" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        <h2 className="text-xl font-bold mb-6">Thêm nhân viên</h2>
        <StaffForm />
      </div>
    </>
  );
}
