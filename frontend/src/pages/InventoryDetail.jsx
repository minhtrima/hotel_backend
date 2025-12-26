import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowLeft,
} from "react-icons/fi";
import LoadingPage from "../components/Loading";

export default function InventoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [id]);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/inventories/${id}`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError("Không thể tải thông tin vật tư.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustQuantity = async () => {
    if (adjustAmount === 0) return;

    setAdjustLoading(true);
    try {
      const response = await fetch(`/api/inventories/${id}/quantity`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: adjustAmount }),
      });

      if (!response.ok) throw new Error("Failed to adjust quantity");
      const data = await response.json();
      setInventory(data);
      setAdjustAmount(0);
    } catch (err) {
      console.error("Error adjusting quantity:", err);
      setError("Không thể điều chỉnh số lượng.");
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn vô hiệu hóa vật tư này?")) return;

    try {
      const response = await fetch(`/api/inventories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete inventory");
      navigate("/inventory");
    } catch (err) {
      console.error("Error deleting inventory:", err);
      setError("Không thể vô hiệu hóa vật tư.");
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "LINEN":
        return "Vải vóc";
      case "TOILETRY":
        return "Đồ vệ sinh";
      case "CLEANING":
        return "Đồ dọn dẹp";
      case "OTHER":
        return "Khác";
      default:
        return category;
    }
  };

  const getTypeLabel = (type) => {
    return type === "CONSUMABLE" ? "Tiêu hao" : "Tái sử dụng";
  };

  if (loading) return <LoadingPage />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!inventory) return <div className="p-6">Không tìm thấy vật tư.</div>;

  const isLowStock = inventory.quantity <= inventory.minQuantity;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/inventory")}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{inventory.name}</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/inventory/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <FiEdit3 className="w-4 h-4" />
            <span>Chỉnh sửa</span>
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-2"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Vô hiệu hóa</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thông tin cơ bản */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Danh mục:</span>
              <span className="ml-2 font-medium">
                {getCategoryLabel(inventory.category)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Loại:</span>
              <span className="ml-2 font-medium">
                {getTypeLabel(inventory.type)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Đơn vị:</span>
              <span className="ml-2 font-medium">{inventory.unit}</span>
            </div>
            <div>
              <span className="text-gray-600">Trạng thái:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${
                  inventory.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {inventory.isActive ? "Hoạt động" : "Vô hiệu"}
              </span>
            </div>
          </div>
        </div>

        {/* Thông tin tồn kho */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Tồn kho</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Số lượng hiện tại:</span>
              <span
                className={`text-2xl font-bold ${
                  isLowStock ? "text-red-600" : "text-gray-800"
                }`}
              >
                {inventory.quantity} {inventory.unit}
                {isLowStock && (
                  <span className="text-sm font-normal ml-2">(Thiếu hàng)</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tồn kho tối thiểu:</span>
              <span className="font-medium">
                {inventory.minQuantity} {inventory.unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Điều chỉnh số lượng */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Điều chỉnh số lượng</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-gray-300 rounded">
            <button
              onClick={() => setAdjustAmount((prev) => prev - 1)}
              className="p-2 text-gray-600 hover:bg-gray-50"
            >
              <FiMinus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-2 text-center border-0 focus:outline-none"
            />
            <button
              onClick={() => setAdjustAmount((prev) => prev + 1)}
              className="p-2 text-gray-600 hover:bg-gray-50"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleAdjustQuantity}
            disabled={adjustAmount === 0 || adjustLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {adjustLoading ? "Đang xử lý..." : "Áp dụng"}
          </button>
          <div className="text-sm text-gray-600">
            {adjustAmount > 0 && `+${adjustAmount}`}
            {adjustAmount < 0 && adjustAmount}
            {adjustAmount !== 0 && ` ${inventory.unit}`}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Nhập số dương để nhập kho, số âm để xuất kho
        </p>
      </div>
    </div>
  );
}
