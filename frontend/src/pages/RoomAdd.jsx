import React from "react";
import RoomForm from "../components/RoomForm";
import BackArrow from "../components/BackArrow";

export default function RoomAdd() {
  return (
    <>
      <BackArrow to="/room" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        <h2 className="text-xl font-bold mb-6">Thêm phòng</h2>
        <RoomForm />
      </div>
    </>
  );
}
