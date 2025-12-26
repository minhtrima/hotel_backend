import React from "react";
import { useLocation } from "react-router-dom";
import BookingDetailForm from "../components/BookingDetailForm";
import BackArrow from "../components/BackArrow";

export default function BookingAdd() {
  const location = useLocation();
  const customerId = location.state?.customerId || "";

  return (
    <>
      <BackArrow to={customerId ? `/customer/${customerId}` : "/customer"} />
      <BookingDetailForm customerId={customerId} />
    </>
  );
}
