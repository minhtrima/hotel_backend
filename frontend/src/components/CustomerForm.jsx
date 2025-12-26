import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerInput from "./CustomerInput";
import ConfirmModal from "./ConfirmModal";
import CCCDScanModal from "./CCCDScanModal";

export default function CustomerForm({
  customerId,
  isBooking = false,
  disable = false,
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    honorific: "Ông",
    gender: "male",
    email: "",
    phoneNumber: "",
    identification: "national_id",
    identificationNumber: "",
    nationality: "",
    dateOfBirth: "",
  });

  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  const getCustomerData = async (id) => {
    const response = await fetch(`/api/customer/${id}`);
    if (!response.ok) throw new Error("Failed to fetch customer data");
    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch customer data");
    return data.customer;
  };

  useEffect(() => {
    if (customerId) {
      getCustomerData(customerId)
        .then((customer) => {
          const formattedDate = customer.dateOfBirth
            ? new Date(customer.dateOfBirth).toISOString().split("T")[0]
            : "";
          setFormData({
            ...customer,
            dateOfBirth: formattedDate,
          });
        })
        .catch((err) => {
          console.error("Failed to load customer data:", err);
          alert("Không thể tải dữ liệu khách hàng.");
        });
    }
  }, [customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "honorific") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        gender: value === "Ông" ? "male" : value === "Bà" ? "female" : "other",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.firstName?.trim())
      errors.firstName = "Tên không được để trống";
    if (!formData.lastName?.trim()) errors.lastName = "Họ không được để trống";
    if (
      formData.email &&
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email.trim())
    ) {
      errors.email = "Email không hợp lệ";
    }
    if (!formData.phoneNumber?.trim())
      errors.phoneNumber = "Số điện thoại không được để trống";
    else if (
      !/^(\+?84|0)[3-9]\d{8,9}$/.test(
        formData.phoneNumber.replace(/[\s-]/g, "")
      )
    )
      errors.phoneNumber =
        "Số điện thoại không hợp lệ (định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx)";
    if (!formData.identificationNumber?.trim())
      errors.identificationNumber = "Số giấy tờ không được để trống";
    if (!formData.dateOfBirth?.trim())
      errors.dateOfBirth = "Ngày sinh không được để trống";

    return errors;
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    console.log("formData: ", formData);
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        const response = await fetch(
          customerId ? `/api/customer/${customerId}` : "/api/customer",
          {
            method: customerId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );
        const data = await response.json();
        if (response.ok && data.success) {
          console.log("Customer saved successfully:", data.customer);
          navigate("/customer");
        } else {
          alert("Có lỗi khi lưu khách hàng.");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối đến máy chủ.");
      }
    } else {
      alert("Vui lòng điền đầy đủ thông tin hợp lệ.");
    }
  };

  const handleDelete = () => {
    if (!customerId) return;
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setShowModal(false);
    try {
      const response = await fetch(`/api/customer/${customerId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        console.log("Customer deleted successfully");
        navigate("/customer");
      } else {
        alert("Có lỗi khi xóa khách hàng.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối đến máy chủ.");
    }
  };

  const handleCCCDDataReceived = (cccdData) => {
    console.log("Received CCCD data:", cccdData);
    setFormData((prev) => ({
      ...prev,
      ...cccdData,
    }));
    setShowScanModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!disable && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setShowScanModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Quét CCCD
            </button>
          </div>
        )}
        <CustomerInput
          formData={formData}
          formErrors={formErrors}
          onChange={handleChange}
          disable={disable}
        />
        {!isBooking && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
              onClick={handleSubmit}
            >
              Lưu khách hàng
            </button>
            {customerId && (
              <button
                type="button"
                className="ml-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 cursor-pointer"
                onClick={handleDelete}
              >
                Xóa
              </button>
            )}
          </div>
        )}
      </form>
      <ConfirmModal
        isOpen={showModal}
        message="Bạn có chắc chắn muốn xoá khách hàng này?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <CCCDScanModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onDataReceived={handleCCCDDataReceived}
      />
    </>
  );
}
