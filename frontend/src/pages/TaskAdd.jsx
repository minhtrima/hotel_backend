import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSave, FiX } from "react-icons/fi";

export default function TaskAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    roomId: "",
    assignedBy: "", // Sẽ được set từ user hiện tại
    assignedTo: "",
    taskType: "cleaning",
    description: "",
    priority: "medium",
  });

  useEffect(() => {
    fetchRooms();
    fetchStaff();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/room");
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff");
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create task");

      navigate("/task");
    } catch (err) {
      console.error("Error creating task:", err);
      setError("Không thể tạo công việc mới.");
    } finally {
      setLoading(false);
    }
  };

  const taskTypeOptions = [
    { value: "cleaning", label: "Dọn phòng" },
    { value: "laundry", label: "Giặt ủi" },
    { value: "refill", label: "Bổ sung vật tư" },
    { value: "inspection", label: "Kiểm tra" },
    { value: "other", label: "Khác" },
  ];

  const priorityOptions = [
    { value: "low", label: "Thấp" },
    { value: "medium", label: "Trung bình" },
    { value: "high", label: "Cao" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tạo công việc mới</h1>
        <button
          onClick={() => navigate("/task")}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
        >
          <FiX className="w-4 h-4" />
          <span>Hủy</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow">
          {/* Tiêu đề công việc - chiếm toàn bộ dòng */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề công việc *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tiêu đề công việc"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phòng *
              </label>
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn phòng</option>
                {rooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.roomNumber} - {room.typeid?.name || "Chưa có loại"} -
                    Tầng {room.floor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giao cho nhân viên *
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn nhân viên</option>
                {staff
                  .filter((member) => member.position === "housekeeping")
                  .map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} - {member.position}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Người giao việc *
              </label>
              <select
                name="assignedBy"
                value={formData.assignedBy}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn người giao việc</option>
                {staff
                  .filter((member) =>
                    ["manager", "receptionist", "admin"].includes(
                      member.position
                    )
                  )
                  .map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} - {member.position}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại công việc *
              </label>
              <select
                name="taskType"
                value={formData.taskType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {taskTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Độ ưu tiên *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả công việc *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả chi tiết công việc cần thực hiện..."
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/task")}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <FiSave className="w-4 h-4" />
              <span>{loading ? "Đang tạo..." : "Tạo công việc"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
