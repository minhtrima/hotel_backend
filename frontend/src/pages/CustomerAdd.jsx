import React from "react";
import CustomerForm from "../components/CustomerForm";
import BackArrow from "../components/BackArrow";

export default function CustomerAdd() {
  return (
    <>
      <BackArrow to="/customer" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        <h2 className="text-xl font-bold mb-6">Thêm khách hàng</h2>
        <CustomerForm />
      </div>
    </>
  );
}
