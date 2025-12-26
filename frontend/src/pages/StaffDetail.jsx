import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AiFillEdit } from "react-icons/ai";
import {
  FaCheck,
  FaTimes,
  FaUser,
  FaUserPlus,
  FaUserTimes,
} from "react-icons/fa";
import StaffForm from "../components/StaffForm";
import BackArrow from "../components/BackArrow";
// import ConfirmContext from "../../contexts/ConfirmContext";

export default function StaffDetail() {
  const navigate = useNavigate();
  const { staffId } = useParams();
  const [staff, setStaff] = useState({});
  const [accountStatus, setAccountStatus] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [useUrl, setUseUrl] = useState(false);
  //   const confirm = useContext(ConfirmContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/staff/${staffId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(data.message);
          return navigate("/");
        }
        setStaff(data.staff);
        console.log("Staff data:", data.staff);

        // Check account status
        await checkAccountStatus();
      } catch (err) {
        console.log(err);
        setError("Failed to load staff.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [navigate, staffId]);

  const checkAccountStatus = async () => {
    try {
      const res = await fetch(`/api/account/status/${staffId}`);
      const data = await res.json();
      if (data.success) {
        setAccountStatus(data.status);
      }
    } catch (err) {
      console.error("Error checking account status:", err);
    }
  };

  const createAccount = async () => {
    if (
      window.confirm(
        "Bạn có chắc muốn tạo tài khoản đăng nhập cho nhân viên này?"
      )
    ) {
      try {
        setLoadingAccount(true);
        const res = await fetch(`/api/account/create/${staffId}`, {
          method: "POST",
        });
        const data = await res.json();

        if (data.success) {
          alert("Email kích hoạt đã được gửi đến nhân viên!");
          await checkAccountStatus();
        } else {
          alert("Lỗi tạo tài khoản: " + data.message);
        }
      } catch (err) {
        console.error("Error creating account:", err);
        alert("Có lỗi xảy ra khi tạo tài khoản");
      } finally {
        setLoadingAccount(false);
      }
    }
  };

  const restoreAccount = async () => {
    if (
      window.confirm(
        "Bạn có chắc muốn khôi phục tài khoản đăng nhập cho nhân viên này? Tài khoản hiện tại sẽ bị vô hiệu hóa và email kích hoạt mới sẽ được gửi."
      )
    ) {
      try {
        setLoadingAccount(true);
        const res = await fetch(`/api/account/restore/${staffId}`, {
          method: "POST",
        });
        const data = await res.json();

        if (data.success) {
          alert("Email kích hoạt mới đã được gửi đến nhân viên!");
          await checkAccountStatus();
        } else {
          alert("Lỗi khôi phục tài khoản: " + data.message);
        }
      } catch (err) {
        console.error("Error restoring account:", err);
        alert("Có lỗi xảy ra khi khôi phục tài khoản");
      } finally {
        setLoadingAccount(false);
      }
    }
  };

  const handleAvatarChange = async () => {
    try {
      let res;
      if (useUrl) {
        // If using URL
        res = await fetch(`/api/staff/${staff._id}/avatar`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ avatar: avatarUrl, isBuffer: false }),
        });
      } else {
        // If using file
        const fileInput = document.getElementById("fileInput");
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("avatar", file);
        formData.append("isBuffer", true);

        res = await fetch(`/api/auth/user/${staff._id}/avatar`, {
          method: "PUT",
          body: formData,
        });
      }

      const data = await res.json();
      if (data.success) {
        alert("Cập nhật ảnh đại diện thành công");
        setStaff((prev) => ({ ...prev, avatar: data.avatar }));
        setShowAvatarModal(false);
      } else {
        alert("Cập nhật ảnh đại diện thất bại: " + data.message);

        setShowAvatarModal(false);
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      setShowAvatarModal(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  return (
    <>
      <BackArrow to="/staff" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        {loading && <p className="text-center">Đang tải...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <h1 className="text-center mt-5 font-bold text-2xl w-full">
          Thông tin người dùng
        </h1>
        <div className="relative w-full flex justify-center mt-5 pb-5">
          <div className="relative group">
            <img
              src={staff.avatar}
              alt="User Avatar"
              className="rounded-full w-20 h-20"
            />
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowAvatarModal(true)} // Open modal
            >
              <AiFillEdit className="text-white text-2xl" />
            </button>
          </div>
        </div>
        <StaffForm staff={staff}></StaffForm>

        {/* Account Status and Management Section */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FaUser className="mr-2" />
            Quản lý tài khoản đăng nhập
          </h2>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  Trạng thái tài khoản:
                </span>
                {accountStatus === null ? (
                  <span className="text-gray-500">Đang kiểm tra...</span>
                ) : accountStatus === "no_account" ? (
                  <span className="flex items-center text-gray-600">
                    <FaTimes className="mr-1 text-red-500" />
                    Chưa có tài khoản
                  </span>
                ) : accountStatus === "active" ? (
                  <span className="flex items-center text-green-600">
                    <FaCheck className="mr-1 text-green-500" />
                    Tài khoản đã kích hoạt
                  </span>
                ) : accountStatus === "pending" ? (
                  <span className="flex items-center text-yellow-600">
                    <FaUser className="mr-1 text-yellow-500" />
                    Chờ kích hoạt
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <FaTimes className="mr-1 text-red-500" />
                    Tài khoản chưa kích hoạt
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {accountStatus === "no_account" && (
                <button
                  onClick={createAccount}
                  disabled={loadingAccount}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaUserPlus className="mr-2" />
                  {loadingAccount ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              )}

              {accountStatus === "active" && (
                <button
                  onClick={restoreAccount}
                  disabled={loadingAccount}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaUserTimes className="mr-2" />
                  {loadingAccount ? "Đang khôi phục..." : "Khôi phục tài khoản"}
                </button>
              )}

              {accountStatus === "pending" && (
                <div className="text-sm text-gray-600">
                  <p>
                    Email kích hoạt đã được gửi. Nhân viên cần kiểm tra email để
                    hoàn tất kích hoạt.
                  </p>
                  <button
                    onClick={restoreAccount}
                    disabled={loadingAccount}
                    className="mt-2 flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <FaUserTimes className="mr-1" />
                    {loadingAccount ? "Đang gửi lại..." : "Gửi lại email"}
                  </button>
                </div>
              )}

              {accountStatus === "inactive" && (
                <button
                  onClick={restoreAccount}
                  disabled={loadingAccount}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaUserTimes className="mr-2" />
                  {loadingAccount ? "Đang khôi phục..." : "Khôi phục tài khoản"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center mt-10 ">
          {/* Remove the change password button as we've replaced it with account management */}
        </div>
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-5 rounded shadow-md w-1/3">
              <h2 className="text-center text-lg font-bold mb-4">
                Cập nhật avatar
              </h2>
              <div className="flex justify-center mb-4">
                <button
                  type="button"
                  className={`btn  rounded p-1 ${
                    !useUrl ? "bg-blue-500 text-white" : "bg-gray-300"
                  }`}
                  onClick={() => setUseUrl(false)}
                >
                  Tải ảnh lên
                </button>
                <button
                  type="button"
                  className={`btn ml-2  rounded p-1 ${
                    useUrl ? "bg-blue-500 text-white" : "bg-gray-300"
                  }`}
                  onClick={() => setUseUrl(true)}
                >
                  Nhập URL
                </button>
              </div>
              {useUrl ? (
                <div className="mb-4">
                  <input
                    type="text"
                    value={avatarUrl || ""}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Nhập URL hình ảnh"
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    className="border rounded px-2 py-1 w-full"
                    onChange={handleFileChange}
                  />
                </div>
              )}
              {avatarUrl && (
                <div className="flex justify-center mb-2">
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-full"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={handleAvatarChange} // Save avatar
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={() => setShowAvatarModal(false)} // Close modal
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
