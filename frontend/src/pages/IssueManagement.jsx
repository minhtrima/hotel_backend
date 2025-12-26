import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiFilter, FiRefreshCw } from "react-icons/fi";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";
import IssueStatusManager from "../components/IssueStatusManager";
import { usePermissions } from "../hooks/usePermissions";

const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return (
    d.toLocaleDateString("vi-VN") +
    " " +
    d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

export default function IssueManagement() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Kiểm tra quyền truy cập - chỉ quản lý mới có thể truy cập
  useEffect(() => {
    if (!permissions.canManageStaff) {
      navigate("/unauthorized");
      return;
    }
  }, [permissions, navigate]);

  const fetchIssues = async (category = "", status = "") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (status) params.append("status", status);

      // Lấy các task có báo cáo sự cố
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error("Failed to fetch issues");

      const data = await response.json();

      // Chỉ lấy các task có issue
      const issueData = data
        .filter((task) => task.issue && task.issue.category)
        .map((task) => ({
          id: task._id,
          title: task.title || "Chưa có tiêu đề",
          roomNumber: task.roomId?.roomNumber || "Không rõ",
          roomType: task.roomId?.typeid?.name || task.roomId?.type || "",
          reportedByName: task.reportBy?.name || "Không rõ",
          assignedToName: task.assignedTo?.name || "Không rõ",
          description: task.description,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
          issue: task.issue,
          reportBy: task.reportBy,
          roomId: task.roomId,
        }));

      setIssues(issueData);
    } catch (error) {
      console.error("Error fetching issues:", error);
      setError("Không thể tải danh sách sự cố. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues(categoryFilter, statusFilter);
  }, [categoryFilter, statusFilter]);

  const handleIssueUpdate = (updatedTask) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === updatedTask._id || issue.id === updatedTask.id
          ? { ...issue, status: updatedTask.status }
          : issue
      )
    );
    // Refresh để cập nhật dữ liệu
    fetchIssues(categoryFilter, statusFilter);
  };

  const handleRowClick = (issue) => {
    setSelectedIssue(issue);
    setIsDetailModalOpen(true);
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "maintenance":
        return "Bảo trì";
      case "guest-complaint":
        return "Khiếu nại khách hàng";
      case "other":
        return "Khác";
      default:
        return category;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      case "guest-complaint":
        return "bg-red-100 text-red-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "in-progress":
        return "Đang thực hiện";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      key: "roomNumber",
      label: "Phòng",
      render: (issue) => (
        <div className="font-medium text-gray-900">{issue.roomNumber}</div>
      ),
    },
    {
      key: "category",
      label: "Loại sự cố",
      render: (issue) => (
        <span
          className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getCategoryColor(
            issue.issue.category
          )}`}
        >
          {getCategoryLabel(issue.issue.category)}
        </span>
      ),
    },
    {
      key: "title",
      label: "Tiêu đề",
      render: (issue) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">
            {issue.title}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {issue.description}
          </div>
        </div>
      ),
    },
    {
      key: "reportedBy",
      label: "Người báo cáo",
      render: (issue) => (
        <div className="text-gray-900">{issue.reportedByName}</div>
      ),
    },
    {
      key: "priority",
      label: "Ưu tiên",
      render: (issue) => (
        <span
          className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getPriorityColor(
            issue.priority
          )}`}
        >
          {issue.priority === "high"
            ? "Cao"
            : issue.priority === "medium"
            ? "Trung bình"
            : "Thấp"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (issue) => (
        <span
          className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
            issue.status
          )}`}
        >
          {getStatusLabel(issue.status)}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Thời gian tạo",
      render: (issue) => (
        <div className="text-sm text-gray-500">
          {formatDateTime(issue.createdAt)}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiAlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý sự cố
              </h1>
              <p className="text-gray-600">
                Theo dõi và xử lý các báo cáo sự cố
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchIssues(categoryFilter, statusFilter)}
            className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center space-x-2 mb-3">
          <FiFilter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Bộ lọc</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại sự cố
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="maintenance">Bảo trì</option>
              <option value="guest-complaint">Khiếu nại khách hàng</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="in-progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FiAlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Issues table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <DataTable
          columns={columns}
          data={issues}
          onRowClick={handleRowClick}
          emptyMessage="Không có sự cố nào"
          loading={loading}
        />
      </div>

      {/* Issue Detail Modal */}
      {isDetailModalOpen && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chi tiết sự cố - Phòng {selectedIssue.roomNumber}
                </h3>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  {selectedIssue.title}
                </h4>
                <p className="text-gray-600 mb-3">
                  {selectedIssue.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">
                      Người báo cáo:
                    </span>
                    <div className="font-medium">
                      {selectedIssue.reportedByName}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Thời gian:</span>
                    <div className="font-medium">
                      {formatDateTime(selectedIssue.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue Status Manager */}
              <IssueStatusManager
                task={selectedIssue}
                onUpdate={handleIssueUpdate}
                userPosition="manager" // Chỉ quản lý mới được truy cập trang này
              />

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
