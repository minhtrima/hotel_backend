import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("verifying"); // verifying, form, success, error
  const [userInfo, setUserInfo] = useState(null);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStep("error");
      setLoading(false);
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/account/activate/${token}`);
      const data = await response.json();

      if (data.success) {
        setUserInfo(data.user);
        setStep("form");
      } else {
        setStep("error");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/account/activate/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setStep("success");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setFormErrors({ general: data.message || "Có lỗi xảy ra" });
      }
    } catch (error) {
      console.error("Error setting password:", error);
      setFormErrors({ general: "Có lỗi xảy ra khi thiết lập mật khẩu" });
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-lg shadow-md">
          <FaTimesCircle className="mx-auto text-6xl text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Liên kết không hợp lệ
          </h2>
          <p className="text-gray-600 mb-6">
            Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Về trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-lg shadow-md">
          <FaCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Kích hoạt thành công!
          </h2>
          <p className="text-gray-600 mb-6">
            Tài khoản của bạn đã được kích hoạt thành công. Đang chuyển hướng
            đến trang đăng nhập...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Kích hoạt tài khoản
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Chào mừng <strong>{userInfo?.name}</strong>!<br />
            Vui lòng thiết lập mật khẩu để kích hoạt tài khoản.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mật khẩu mới *
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.password ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10`}
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-4 w-4 text-gray-400" />
                ) : (
                  <FaEye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Xác nhận mật khẩu *
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.confirmPassword
                    ? "border-red-300"
                    : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10`}
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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

          {formErrors.general && (
            <div className="text-sm text-red-600 text-center">
              {formErrors.general}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang xử lý..." : "Kích hoạt tài khoản"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Quay về đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
