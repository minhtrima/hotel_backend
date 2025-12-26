import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  stateStart,
  signInSuccess,
  stateFailure,
} from "../redux/user/userSlice";

export default function LoginForm({ setAuthError }) {
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = React.useState({
    email: "",
    password: "",
    auth: "",
  });
  const [loading, setLoading] = React.useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = "";

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!value) error = "Bạn chưa nhập email";
      else if (!emailRegex.test(value)) {
        error = "Email không đúng định dạng";
      }
    }

    if (name === "password") {
      if (!value.trim()) {
        error = "Bạn chưa nhập mật khẩu";
      } else if (value.length < 6) {
        error = "Mật khẩu phải có ít nhất 6 ký tự";
      }
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((field) => {
      validateField(field, formData[field]);
      if (errors[field]) {
        newErrors[field] = errors[field];
      }
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        dispatch(stateStart());

        const isEmail = formData.email.includes("@");

        const updatedFormData = {
          ...formData,
          email: isEmail ? formData.email : "",
          phoneNumber: isEmail ? "" : formData.email,
        };
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFormData),
        });

        const data = await res.json();

        if (data.success === false) {
          dispatch(stateFailure(data.message));
          return;
        }

        console.log("Login successful:", data);
        dispatch(signInSuccess(data));
        navigate("/");
      } catch (error) {
        setAuthError(false);
        dispatch(stateFailure(error));
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email:
        </label>
        <input
          type="text"
          name="email"
          onChange={handleChange}
          value={formData.email}
          autoFocus={true}
          className={`mt-1 block w-full px-4 py-2 border ${
            errors.email ? "border-red-600" : "border-gray-300"
          }  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.email && (
          <span className="text-red-600 text-sm">{errors.email}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Mật khẩu:
        </label>
        <input
          type="password"
          name="password"
          onChange={handleChange}
          className={`mt-1 block w-full px-4 py-2 border ${
            errors.password ? "border-red-600" : "border-gray-300"
          }  rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.password && (
          <span className="text-red-600 text-sm">{errors.password}</span>
        )}
      </div>
      <h4 className="text-center text-red-600">
        {errors.auth ? errors.auth : ""}
      </h4>
      <div className="flex justify-center">
        <button
          disabled={loading}
          type="submit"
          className="w-30 py-2 px-4 bg-blue-800 text-white font-medium rounded-md shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? "Đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </form>
  );
}
