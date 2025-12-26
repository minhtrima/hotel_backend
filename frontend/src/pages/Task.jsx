import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoArrowRight } from "react-icons/go";
import { FiPlus, FiFilter } from "react-icons/fi";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";
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

export default function Task() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchTasks = async (status = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      console.log("Fetched tasks raw data:", data);

      return data.map((task) => ({
        id: task._id,
        title: task.title || "Chưa có tiêu đề",
        roomNumber: task.roomId?.roomNumber || "Không rõ",
        roomType: task.roomId?.typeid?.name || task.roomId?.type || "Không rõ",
        assignedByName: task.assignedBy?.name || "Không rõ",
        assignedToName: task.assignedTo?.name || "Không rõ",
        taskType: task.taskType,
        description: task.description,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
        startTime: task.startTime,
        completedAt: task.completedAt,
        note: task.note,
      }));
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError("Không thể tải dữ liệu công việc.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(statusFilter).then((data) => {
      setTasks(data);
    });
  }, [statusFilter]);

  const getTaskTypeLabel = (taskType) => {
    switch (taskType) {
      case "cleaning":
        return "Dọn phòng";
      case "laundry":
        return "Giặt ủi";
      case "refill":
        return "Bổ sung vật tư";
      case "inspection":
        return "Kiểm tra";
      case "other":
        return "Khác";
      default:
        return taskType;
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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "low":
        return "Thấp";
      case "medium":
        return "Trung bình";
      case "high":
        return "Cao";
      default:
        return priority;
    }
  };

  const columns = [
    {
      header: "Tiêu đề",
      accessorKey: "title",
      cell: ({ getValue }) => (
        <div className="font-medium w-32 truncate" title={getValue()}>
          {getValue()}
        </div>
      ),
    },
    {
      header: "Phòng",
      accessorKey: "roomNumber",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.roomNumber}</div>
          {row.original.roomType && (
            <div className="text-xs text-gray-500">{row.original.roomType}</div>
          )}
        </div>
      ),
    },
    {
      header: "Loại công việc",
      accessorKey: "taskType",
      cell: ({ getValue }) => {
        const value = getValue();
        const label = getTaskTypeLabel(value);
        let color = "";

        switch (value) {
          case "cleaning":
            color = "bg-blue-100 text-blue-800";
            break;
          case "laundry":
            color = "bg-green-100 text-green-800";
            break;
          case "refill":
            color = "bg-yellow-100 text-yellow-800";
            break;
          case "inspection":
            color = "bg-purple-100 text-purple-800";
            break;
          default:
            color = "bg-gray-100 text-gray-800";
        }

        return (
          <span
            className={`px-2 py-1 rounded-full text-sm font-medium ${color}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      header: "Được giao",
      accessorKey: "assignedToName",
    },
    {
      header: "Ưu tiên",
      accessorKey: "priority",
      cell: ({ getValue }) => {
        const value = getValue();
        const label = getPriorityLabel(value);
        let color = "";

        switch (value) {
          case "high":
            color = "bg-red-100 text-red-800";
            break;
          case "medium":
            color = "bg-yellow-100 text-yellow-800";
            break;
          case "low":
            color = "bg-green-100 text-green-800";
            break;
          default:
            color = "bg-gray-100 text-gray-800";
        }

        return (
          <span
            className={`px-2 py-1 rounded-full text-sm font-medium ${color}`}
          >
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
        const label = getStatusLabel(value);
        let color = "";

        switch (value) {
          case "pending":
            color = "bg-gray-100 text-gray-800";
            break;
          case "in-progress":
            color = "bg-blue-100 text-blue-800";
            break;
          case "completed":
            color = "bg-green-100 text-green-800";
            break;
          case "cancelled":
            color = "bg-red-100 text-red-800";
            break;
          default:
            color = "bg-gray-100 text-gray-800";
        }

        return (
          <span
            className={`px-2 py-1 rounded-full text-sm font-medium ${color}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      header: "Thời gian tạo",
      accessorKey: "createdAt",
      cell: ({ getValue }) => formatDateTime(getValue()),
    },
    {
      header: "Thao tác",
      id: "arrow",
      cell: ({ row }) => {
        return (
          <div
            className="ml-auto cursor-pointer"
            onClick={() => navigate("/task/" + row.original.id)}
          >
            <GoArrowRight className="w-5 h-5 text-gray-500" />
          </div>
        );
      },
    },
  ];

  const reloadTasks = async () => {
    const data = await fetchTasks(statusFilter);
    setTasks(data);
  };

  const extraHeaderContent = (
    <div className="flex space-x-3">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="pending">Chờ xử lý</option>
        <option value="in-progress">Đang thực hiện</option>
        <option value="completed">Hoàn thành</option>
        <option value="cancelled">Đã hủy</option>
      </select>
      {permissions.canCreateTask && (
        <button
          onClick={() => navigate("/task/create")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo công việc</span>
        </button>
      )}
      <button
        onClick={reloadTasks}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tải lại
      </button>
    </div>
  );

  // Tính toán thống kê
  const stats = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    inProgress: tasks.filter((task) => task.status === "in-progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    high: tasks.filter((task) => task.priority === "high").length,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý công việc
          </h1>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span>
              Tổng: <strong>{stats.total}</strong>
            </span>
            <span className="text-gray-500">
              Chờ: <strong>{stats.pending}</strong>
            </span>
            <span className="text-blue-600">
              Đang làm: <strong>{stats.inProgress}</strong>
            </span>
            <span className="text-green-600">
              Hoàn thành: <strong>{stats.completed}</strong>
            </span>
            <span className="text-red-600">
              Ưu tiên cao: <strong>{stats.high}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {/* Filter bar luôn hiển thị */}
          <div className="mb-6 flex justify-end">{extraHeaderContent}</div>

          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {statusFilter
                  ? "Không có công việc nào với trạng thái này."
                  : "Không có công việc nào."}
              </p>
              {permissions.canCreateTask && (
                <button
                  onClick={() => navigate("/task/create")}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2 mx-auto"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Tạo công việc đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={tasks}
              extraHeaderContent={null}
            />
          )}
        </>
      )}
    </div>
  );
}
