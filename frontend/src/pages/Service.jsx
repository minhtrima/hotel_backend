import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { GoArrowRight } from "react-icons/go";

export default function Service() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchServiceData = async () => {
    setLoading(true);
    const response = await fetch("/api/service");
    if (!response.ok) throw new Error("Failed to fetch service data");

    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch service data");

    return data.services.map((service) => ({
      id: service._id,
      name: service.name,
      description: service.description,
      price: service.price,
      unit: service.unit,
      unitDisplay: service.unitDisplay,
      category: service.category,
      isActive: service.isActive,
    }));
  };

  useEffect(() => {
    fetchServiceData()
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load services:", err);
        setError("Không thể tải dữ liệu dịch vụ.");
        setLoading(false);
      });
  }, []);

  const reloadServices = async () => {
    setLoading(true);
    try {
      const data = await fetchServiceData();
      setServices(data);
    } catch (err) {
      console.error("Failed to load services:", err);
      setError("Không thể tải dữ liệu dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  const extraHeaderContent = (
    <div className="flex space-x-3">
      <button
        onClick={() => navigate("/service/add")}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
      >
        <span>+ Thêm dịch vụ</span>
      </button>
      <button
        onClick={reloadServices}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tải lại
      </button>
    </div>
  );

  // Calculate stats
  const stats = {
    total: services.length,
    active: services.filter((service) => service.isActive).length,
    room: services.filter((service) => service.category === "room").length,
    food: services.filter((service) => service.category === "food").length,
    transport: services.filter((service) => service.category === "transport")
      .length,
  };

  const columns = [
    { header: "Tên dịch vụ", accessorKey: "name" },
    {
      header: "Giá",
      accessorKey: "price",
      cell: ({ row }) => {
        const price = row.original.price;
        const unit = row.original.unit;
        const unitDisplay = row.original.unitDisplay;
        return (
          <>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(price)}
            {unitDisplay ? ` / ${unitDisplay}` : unit ? ` / ${unit}` : ""}
          </>
        );
      },
    },
    {
      header: "Loại",
      accessorKey: "category",
      cell: ({ getValue }) => {
        const val = getValue();
        if (val === "room") return "Dịch vụ phòng";
        if (val === "food") return "Ẩm thực";
        if (val === "transport") return "Vận chuyển";
        return "Khác";
      },
    },
    {
      header: "Trạng thái",
      accessorKey: "isActive",
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="text-green-600">Đang hoạt động</span>
        ) : (
          <span className="text-gray-400">Ngừng hoạt động</span>
        ),
    },
    {
      header: "Thao tác",
      id: "arrow",
      cell: ({ row }) => {
        const serviceId = row.original.id;
        return (
          <div
            className="ml-auto cursor-pointer"
            onClick={() => navigate("/service/" + serviceId)}
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý dịch vụ</h1>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span>
              Tổng: <strong>{stats.total}</strong>
            </span>
            <span className="text-green-600">
              Hoạt động: <strong>{stats.active}</strong>
            </span>
            <span className="text-blue-600">
              Phòng: <strong>{stats.room}</strong>
            </span>
            <span className="text-orange-600">
              Ẩm thực: <strong>{stats.food}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : services.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Không có dịch vụ nào.</p>
          <button
            onClick={() => navigate("/service/add")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2 mx-auto"
          >
            <span>+ Thêm dịch vụ đầu tiên</span>
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={services}
          extraHeaderContent={extraHeaderContent}
        />
      )}
    </div>
  );
}
