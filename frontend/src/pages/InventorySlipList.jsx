import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function InventorySlipList() {
  const navigate = useNavigate();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ roomId: "" });
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchSlips();
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchSlips();
  }, [filter]);

  const fetchFilterData = async () => {
    try {
      const [roomRes, taskRes] = await Promise.all([
        fetch("/api/rooms").then((res) => res.json()),
        fetch("/api/tasks").then((res) => res.json()),
      ]);

      setRooms(roomRes.data || []);
      setTasks(taskRes.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu lọc:", error);
    }
  };

  const fetchSlips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.roomId) params.append("roomId", filter.roomId);
      if (filter.taskId) params.append("taskId", filter.taskId);

      const response = await fetch(`/api/inventory-slips?${params}`);
      const data = await response.json();

      if (data.success) {
        let filteredSlips = data.data;
        setSlips(filteredSlips);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách phiếu:", error);
      alert("Không thể tải danh sách phiếu");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSlip = async (slipId) => {
    if (!window.confirm("Bạn có chắc muốn hủy phiếu này?")) return;

    try {
      const response = await fetch(`/api/inventory-slips/${slipId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Đã hủy phiếu và hoàn kho");
        fetchSlips();
      } else {
        alert(data.error || "Không thể hủy phiếu");
      }
    } catch (error) {
      console.error("Lỗi hủy phiếu:", error);
      alert("Không thể hủy phiếu");
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      REFILL: "Bổ sung",
      REPLACEMENT: "Thay thế",
      EMERGENCY: "Khẩn cấp",
    };
    return types[type] || type;
  };

  const getTypeBadge = (type) => {
    const colors = {
      REFILL: "bg-blue-100 text-blue-800",
      REPLACEMENT: "bg-yellow-100 text-yellow-800",
      EMERGENCY: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 ${colors[type]} rounded text-xs font-medium`}>
        {getTypeLabel(type)}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Quản lý phiếu vật tư
        </h1>
        <button
          onClick={() => navigate("/inventory/receipt/create")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          + Tạo phiếu mới
        </button>
      </div>

      {/* Slip List */}
      {loading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : slips.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Không có phiếu nào
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slips.map((slip) => (
            <div
              key={slip._id}
              className="bg-white p-4 rounded shadow hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">
                    Phòng: {slip.roomId?.roomNumber || "N/A"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    NV: {slip.staffId?.name || "N/A"}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {getTypeBadge(slip.type)}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <p>Số mặt hàng: {slip.items?.length || 0}</p>
                <p>
                  Ngày tạo:{" "}
                  {new Date(slip.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/inventory/receipt/${slip._id}`)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
