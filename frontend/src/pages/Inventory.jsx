import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoArrowRight } from "react-icons/go";
import { FiPlus, FiEdit3 } from "react-icons/fi";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";
import { usePermissions } from "../hooks/usePermissions";

export default function Inventory() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInventories = async () => {
    setLoading(true);
    const response = await fetch("/api/inventories");
    if (!response.ok) throw new Error("Failed to fetch inventories");
    const data = await response.json();

    return data
      .map((inventory) => ({
        id: inventory._id,
        name: inventory.name,
        category: inventory.category,
        type: inventory.type,
        unit: inventory.unit,
        quantity: inventory.quantity,
        minQuantity: inventory.minQuantity,
        isActive: inventory.isActive,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
      }))
      .sort((a, b) => {
        // Define category order: LINEN -> TOILETRY -> CLEANING -> OTHER
        const categoryOrder = ["LINEN", "TOILETRY", "CLEANING", "OTHER"];
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);

        // Sort by category first, then by name
        if (a.category !== b.category) {
          return aIndex - bIndex;
        }
        return a.name.localeCompare(b.name);
      });
  };

  useEffect(() => {
    fetchInventories()
      .then((data) => {
        setInventories(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading inventories:", err);
        setError("Không thể tải dữ liệu kho.");
        setLoading(false);
      });
  }, []);

  const getCategoryLabel = (category) => {
    switch (category) {
      case "LINEN":
        return "Vải vóc";
      case "TOILETRY":
        return "Đồ vệ sinh";
      case "CLEANING":
        return "Đồ dọn dẹp";
      case "MINIBAR":
        return "Minibar";
      case "OTHER":
        return "Khác";
      default:
        return category;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "CONSUMABLE":
        return "Tiêu hao";
      case "REUSABLE":
        return "Tái sử dụng";
      default:
        return type;
    }
  };

  const columns = [
    {
      header: "Tên vật tư",
      accessorKey: "name",
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    },
    {
      header: "Danh mục",
      accessorKey: "category",
      cell: ({ getValue }) => {
        const value = getValue();
        const label = getCategoryLabel(value);
        let color = "";

        switch (value) {
          case "LINEN":
            color = "bg-blue-100 text-blue-800";
            break;
          case "TOILETRY":
            color = "bg-green-100 text-green-800";
            break;
          case "CLEANING":
            color = "bg-yellow-100 text-yellow-800";
            break;
          case "MINIBAR":
            color = "bg-pink-100 text-pink-800";
            break;
          case "OTHER":
            color = "bg-gray-100 text-gray-800";
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
      header: "Loại",
      accessorKey: "type",
      cell: ({ getValue }) => {
        const value = getValue();
        const label = getTypeLabel(value);
        const color =
          value === "CONSUMABLE"
            ? "bg-red-100 text-red-800"
            : "bg-purple-100 text-purple-800";

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
      header: "Đơn vị",
      accessorKey: "unit",
    },
    {
      header: "Số lượng",
      accessorKey: "quantity",
      cell: ({ row }) => {
        const quantity = row.original.quantity;
        const minQuantity = row.original.minQuantity;
        const isLowStock = quantity <= minQuantity;

        return (
          <span className={isLowStock ? "text-red-600 font-semibold" : ""}>
            {quantity}
            {isLowStock && <span className="ml-1 text-xs">(Thiếu hàng)</span>}
          </span>
        );
      },
    },
    {
      header: "Tồn kho tối thiểu",
      accessorKey: "minQuantity",
    },
    {
      header: "Trạng thái",
      accessorKey: "isActive",
      cell: ({ getValue }) => {
        const isActive = getValue();
        return (
          <span
            className={`px-2 py-1 rounded-full text-sm font-medium ${
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isActive ? "Hoạt động" : "Vô hiệu"}
          </span>
        );
      },
    },
    {
      header: "Thao tác",
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/inventory/${row.original.id}/edit`)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Chỉnh sửa"
            >
              <FiEdit3 className="w-4 h-4" />
            </button>
            <div
              className="cursor-pointer"
              onClick={() => navigate(`/inventory/${row.original.id}`)}
            >
              <GoArrowRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        );
      },
    },
  ];

  const reloadInventories = async () => {
    setLoading(true);
    try {
      const data = await fetchInventories();
      setInventories(data);
    } catch (err) {
      console.error("Error loading inventories:", err);
      setError("Không thể tải dữ liệu kho.");
    } finally {
      setLoading(false);
    }
  };

  const extraHeaderContent = (
    <div className="flex space-x-3">
      {permissions.canCreateInventory && (
        <button
          onClick={() => navigate("/inventory/create")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
        >
          <FiPlus className="w-4 h-4" />
          <span>Thêm vật tư</span>
        </button>
      )}
      <button
        onClick={reloadInventories}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tải lại
      </button>
    </div>
  );

  // Tính toán thống kê
  const stats = {
    total: inventories.length,
    lowStock: inventories.filter((item) => item.quantity <= item.minQuantity)
      .length,
    inactive: inventories.filter((item) => !item.isActive).length,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý kho</h1>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span>
              Tổng: <strong>{stats.total}</strong>
            </span>
            <span className="text-red-600">
              Thiếu hàng: <strong>{stats.lowStock}</strong>
            </span>
            <span className="text-gray-500">
              Vô hiệu: <strong>{stats.inactive}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : inventories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Không có vật tư nào trong kho.</p>
          {permissions.canCreateInventory && (
            <button
              onClick={() => navigate("/inventory/create")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2 mx-auto"
            >
              <FiPlus className="w-4 h-4" />
              <span>Thêm vật tư đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inventories}
          extraHeaderContent={extraHeaderContent}
        />
      )}
    </div>
  );
}
