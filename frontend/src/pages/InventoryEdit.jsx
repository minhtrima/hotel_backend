import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiSave, FiX, FiArrowLeft } from "react-icons/fi";
import LoadingPage from "../components/Loading";

export default function InventoryEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "LINEN",
    type: "CONSUMABLE",
    unit: "cái",
    quantity: 0,
    minQuantity: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchInventory();
  }, [id]);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/inventories/${id}`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      setFormData(data);
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError("Không thể tải thông tin vật tư.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "quantity" || name === "minQuantity"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/inventories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update inventory");

      navigate(`/inventory/${id}`);
    } catch (err) {
      console.error("Error updating inventory:", err);
      setError("Không thể cập nhật vật tư.");
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = [
    { value: "LINEN", label: "Vải vóc" },
    { value: "TOILETRY", label: "Đồ vệ sinh" },
    { value: "CLEANING", label: "Đồ dọn dẹp" },
    { value: "OTHER", label: "Khác" },
  ];

  const typeOptions = [
    { value: "CONSUMABLE", label: "Tiêu hao" },
    { value: "REUSABLE", label: "Tái sử dụng" },
  ];

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/inventory/${id}`)}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa vật tư</h1>
        </div>
        <button
          onClick={() => navigate(`/inventory/${id}`)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên vật tư *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên vật tư"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn vị
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="cái, chai, bộ, kg..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng hiện tại
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn kho tối thiểu
              </label>
              <input
                type="number"
                name="minQuantity"
                value={formData.minQuantity}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">
                Vật tư đang hoạt động
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate(`/inventory/${id}`)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
