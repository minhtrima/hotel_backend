import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";
import IssueStatusManager from "../components/IssueStatusManager";
import { GoArrowRight } from "react-icons/go";

import { usePermissions } from "../hooks/usePermissions";

export default function IssueReportManagement() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chỉ cho phép admin hoặc manager truy cập trang này
  const isAdmin = permissions.userRole === "admin";
  const isManager =
    permissions.userRole === "staff" && permissions.userPosition === "manager";
  if (!isAdmin && !isManager) {
    return (
      <div className="p-6 text-red-500 font-semibold">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  const fetchIssueTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tasks?taskType=issue-report");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      // Lọc các task có issue.category (báo cáo sự cố)
      const issueTasks = data.filter(
        (task) => task.issue && task.issue.category
      );
      setTasks(issueTasks);
    } catch (err) {
      setError("Không thể tải dữ liệu sự cố.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueTasks();
  }, []);

  const columns = [
    {
      header: "Tiêu đề",
      accessorKey: "title",
      cell: ({ getValue }) => (
        <div className="font-medium w-48 truncate" title={getValue()}>
          {getValue()}
        </div>
      ),
    },
    {
      header: "Phòng",
      accessorKey: "roomId.roomNumber",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.roomId?.roomNumber}</div>
          {row.original.roomId?.typeid?.name && (
            <div className="text-xs text-gray-500">
              {row.original.roomId.typeid.name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Loại sự cố",
      accessorKey: "issue.category",
      cell: ({ row }) => {
        const category = row.original.issue?.category;
        let label = "";
        switch (category) {
          case "maintenance":
            label = "Bảo trì";
            break;
          case "guest-complaint":
            label = "Khiếu nại khách hàng";
            break;
          case "other":
            label = "Khác";
            break;
          default:
            label = category;
        }
        return (
          <span className="px-2 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            {label}
          </span>
        );
      },
    },
    {
      header: "Trạng thái",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const value = getValue();
        let label = "";
        switch (value) {
          case "pending":
            label = "Chờ xử lý";
            break;
          case "in-progress":
            label = "Đang thực hiện";
            break;
          case "completed":
            label = "Hoàn thành";
            break;
          case "cancelled":
            label = "Đã hủy";
            break;
          default:
            label = value;
        }
        return (
          <span className="px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {label}
          </span>
        );
      },
    },
    {
      header: "Thời gian tạo",
      accessorKey: "createdAt",
      cell: ({ getValue }) => {
        const d = new Date(getValue());
        return (
          d.toLocaleDateString("vi-VN") +
          " " +
          d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        );
      },
    },
    {
      header: "Thao tác",
      id: "arrow",
      cell: ({ row }) => (
        <div
          className="ml-auto cursor-pointer"
          onClick={() => navigate(`/issue-report/${row.original._id}`)}
        >
          <GoArrowRight className="w-5 h-5 text-gray-500" />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý sự cố</h1>
        {permissions.canAddIssueReport && (
          <button
            onClick={() => navigate("/issue-report/add")}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2 transition-colors"
          >
            <span>+ Báo cáo sự cố</span>
          </button>
        )}
      </div>
      {loading ? (
        <LoadingPage />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Không có sự cố nào.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={tasks} />
      )}
    </div>
  );
}
