import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import { GoArrowRight } from "react-icons/go";
import LoadingPage from "../components/Loading";
import { usePermissions } from "../hooks/usePermissions";

export default function Staff() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStaffData = async () => {
    setLoading(true);
    const response = await fetch("/api/staff");
    if (!response.ok) {
      setLoading(false);

      throw new Error("Failed to fetch staff data");
    }
    const data = await response.json();
    setLoading(false);
    if (!data.success) {
      throw new Error("Failed to fetch staff data");
    }
    console.log("Staff data:", data.staff);
    return data.staff.map((staff) => ({
      id: staff._id,
      name: staff.name,
      email: staff.email,
      position: staff.position,
      phoneNumber: staff.phoneNumber,
      dateOfJoining: staff.dateOfJoining,
      avatar: staff.avatar || "https://i.pravatar.cc/150?img=0",
    }));
  };

  useEffect(() => {
    fetchStaffData()
      .then((data) => {
        setStaff(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load staff:", err);
        setError("Không thể tải dữ liệu nhân viên.");
        setLoading(false);
      });
  }, []);

  const reloadStaff = async () => {
    setLoading(true);
    try {
      const data = await fetchStaffData();
      setStaff(data);
    } catch (err) {
      console.error("Failed to load staff:", err);
      setError("Không thể tải dữ liệu nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  const extraHeaderContent = (
    <div className="flex space-x-3">
      {permissions.canCreateStaff && (
        <button
          onClick={() => navigate("/staff/add")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
        >
          <span>+ Thêm nhân viên</span>
        </button>
      )}
      <button
        onClick={reloadStaff}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tải lại
      </button>
    </div>
  );

  // Calculate stats
  const stats = {
    total: staff.length,
    managers: staff.filter(
      (s) =>
        s.position?.toLowerCase().includes("manager") ||
        s.position?.toLowerCase().includes("quản lý")
    ).length,
    receptionists: staff.filter(
      (s) =>
        s.position?.toLowerCase().includes("receptionist") ||
        s.position?.toLowerCase().includes("lễ tân")
    ).length,
    housekeeping: staff.filter(
      (s) =>
        s.position?.toLowerCase().includes("housekeeping") ||
        s.position?.toLowerCase().includes("dọn dẹp")
    ).length,
  };

  const columns = [
    {
      header: "Ảnh",
      accessorKey: "avatar",
      cell: ({ getValue }) => (
        <img
          src={getValue()}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
      ),
    },
    {
      header: "Tên",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Chức vụ",
      accessorKey: "position",
    },
    {
      header: "SĐT",
      accessorKey: "phoneNumber",
    },
    {
      header: "Ngày vào làm",
      accessorKey: "dateOfJoining",
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString("vi-VN"),
    },
    {
      header: "Thao tác",
      id: "arrow",
      cell: ({ row }) => {
        const staffId = row.original.id;
        return (
          <div
            className="ml-auto cursor-pointer"
            onClick={() => navigate("/staff/" + staffId)}
          >
            <GoArrowRight className="w-5 h-5 text-gray-500" />
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý nhân viên
          </h1>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span>
              Tổng: <strong>{stats.total}</strong>
            </span>
            <span className="text-purple-600">
              Quản lý: <strong>{stats.managers}</strong>
            </span>
            <span className="text-blue-600">
              Lễ tân: <strong>{stats.receptionists}</strong>
            </span>
            <span className="text-green-600">
              Dọn dẹp: <strong>{stats.housekeeping}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : staff.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Không có nhân viên nào.</p>
          {permissions.canCreateStaff && (
            <button
              onClick={() => navigate("/staff/add")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2 mx-auto"
            >
              <span>+ Thêm nhân viên đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={staff}
          extraHeaderContent={extraHeaderContent}
        />
      )}
    </div>
  );
}
