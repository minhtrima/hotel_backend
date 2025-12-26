import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaEye, FaEyeSlash, FaKey } from "react-icons/fa";
import BackArrow from "../components/BackArrow";

export default function ChangePassword() {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.currentUser);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  // Check if user is logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bạn cần đăng nhập để đổi mật khẩu
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const errors = {};

    if (!formData.currentPassword) {
      errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!formData.newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    } else if (formData.newPassword === formData.currentPassword) {
      errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: currentUser?.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage("Đổi mật khẩu thành công!");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      } else {
        setFormErrors({
          general: data.message || "Có lỗi xảy ra khi đổi mật khẩu",
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setFormErrors({
        general: "Có lỗi xảy ra khi đổi mật khẩu",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (formErrors.general) {
      setFormErrors((prev) => ({ ...prev, general: "" }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <>
      <BackArrow to="/home" />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <FaKey className="mx-auto text-4xl text-blue-600 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h1>
              <p className="text-sm text-gray-600 mt-2">
                Vui lòng nhập mật khẩu hiện tại và mật khẩu mới
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mật khẩu hiện tại *
                </label>
                <div className="relative mt-1">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formErrors.currentPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10`}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPasswords.current ? (
                      <FaEyeSlash className="h-4 w-4 text-gray-400" />
                    ) : (
                      <FaEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {formErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mật khẩu mới *
                </label>
                <div className="relative mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formErrors.newPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10`}
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPasswords.new ? (
                      <FaEyeSlash className="h-4 w-4 text-gray-400" />
                    ) : (
                      <FaEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {formErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Xác nhận mật khẩu mới *
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formErrors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPasswords.confirm ? (
                      <FaEyeSlash className="h-4 w-4 text-gray-400" />
                    ) : (
                      <FaEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {formErrors.general && (
                <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">
                  {formErrors.general}
                </div>
              )}

              {/* Success Message */}
              {submitMessage && (
                <div className="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md">
                  {submitMessage}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 border border-transparent text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
