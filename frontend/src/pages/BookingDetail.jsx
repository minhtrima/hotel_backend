import React from "react";
import BookingDetailForm from "../components/BookingDetailForm";
import BackArrow from "../components/BackArrow";

export default function BookingDetail() {
  return (
    <>
      <BackArrow to="/booking" />
      <BookingDetailForm />
    </>
  );
}
