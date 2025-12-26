import React, { useState } from "react";
import { FaBell, FaSignOutAlt, FaKey } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { signOut } from "../redux/user/userSlice";

export default function Header() {
  const user = useSelector((state) => state.user.currentUser.user);
  const { userPosition } = usePermissions();
  const [showDropdown, setShowDropdown] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        dispatch(signOut());
        navigate("/login");
      } else {
        console.error("Logout failed");
        // Force logout even if server request fails
        dispatch(signOut());
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if error occurs
      dispatch(signOut());
      navigate("/login");
    }
  };

  return (
    <header className="w-full bg-white shadow-md px-6 py-3 flex items-center justify-end">
      <div className="flex items-center gap-4">
        <FaBell className="text-gray-600 text-lg cursor-pointer" />
        <div className="relative">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">
                {user.name || user.username}
              </div>
              <div className="text-xs text-gray-500">{userPosition}</div>
            </div>
            <img
              src={user.avatar || "https://i.pravatar.cc/150?img=0"}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border hover:border-blue-300 transition-colors"
            />
          </div>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/change-password");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaKey className="w-4 h-4" />
                  Đổi mật khẩu
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </header>
  );
}
