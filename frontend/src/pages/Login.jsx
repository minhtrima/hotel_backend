import React from "react";
import LoginForm from "../components/LoginForm";

export default function Login() {
  const [authError, setAuthError] = React.useState();

  return (
    <div
      className={`flex justify-center pt-2 items-center   ${
        authError ? "ping-4 ring-red-600" : ""
      }`}
    >
      <div className="w-full max-w-md p-6  bg-white border border-gray-300 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">Đăng nhập</h2>
        <LoginForm setAuthError={setAuthError} />
      </div>
    </div>
  );
}
