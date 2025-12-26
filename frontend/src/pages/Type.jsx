import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";
import { GoArrowRight } from "react-icons/go";
import BackArrow from "../components/BackArrow";

export default function Type() {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTypeData = async () => {
    setLoading(true);
    const response = await fetch("/api/type");
    if (!response.ok) throw new Error("Failed to fetch type data");

    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch type data");

    console.log("Type data:", data.types);

    return data.types.map((type) => ({
      id: type._id,
      name: type.name,
      capacity: type.capacity,
      maxGuest: type.maxGuest,
      pricePerNight: type.pricePerNight,
    }));
  };

  useEffect(() => {
    fetchTypeData()
      .then((data) => {
        setTypes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load types:", err);
        setError("Không thể tải dữ liệu loại phòng.");
        setLoading(false);
      });
  }, []);

  const reloadTypes = async () => {
    setLoading(true);
    try {
      const data = await fetchTypeData();
      setTypes(data);
    } catch (err) {
      console.error("Failed to load types:", err);
      setError("Không thể tải dữ liệu loại phòng.");
    } finally {
      setLoading(false);
    }
  };

  const extraHeaderContent = (
    <div className="flex space-x-3">
      <button
        onClick={() => navigate("/type/add")}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
      >
        <span>+ Thêm loại phòng</span>
      </button>
      <button
        onClick={reloadTypes}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tải lại
      </button>
    </div>
  );

  // Calculate stats
  const stats = {
    total: types.length,
    avgPrice:
      types.length > 0
        ? Math.round(
            types.reduce((sum, type) => sum + type.pricePerNight, 0) /
              types.length
          )
        : 0,
    maxCapacity:
      types.length > 0 ? Math.max(...types.map((t) => t.capacity)) : 0,
    maxGuest: types.length > 0 ? Math.max(...types.map((t) => t.maxGuest)) : 0,
  };

  const columns = [
    { header: "Tên loại", accessorKey: "name" },
    { header: "Sức chứa", accessorKey: "capacity" },
    { header: "Số khách tối đa", accessorKey: "maxGuest" },
    {
      header: "Giá/đêm",
      accessorKey: "pricePerNight",
      cell: ({ getValue }) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(getValue()),
    },
    {
      header: "Thao tác",
      id: "arrow",
      cell: ({ row }) => {
        const typeId = row.original.id;
        return (
          <div
            className="ml-auto cursor-pointer"
            onClick={() => navigate("/type/" + typeId)}
          >
            <GoArrowRight className="w-5 h-5 text-gray-500" />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <BackArrow to="/room" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý loại phòng
            </h1>
            <div className="flex space-x-4 mt-2 text-sm text-gray-600">
              <span>
                Tổng: <strong>{stats.total}</strong>
              </span>

              <span className="text-blue-600">
                Sức chứa max: <strong>{stats.maxCapacity}</strong>
              </span>
              <span className="text-purple-600">
                Khách max: <strong>{stats.maxGuest}</strong>
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingPage />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : types.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Không có loại phòng nào.</p>
            <button
              onClick={() => navigate("/type/add")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2 mx-auto"
            >
              <span>+ Thêm loại phòng đầu tiên</span>
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={types}
            extraHeaderContent={extraHeaderContent}
          />
        )}
      </div>{" "}
    </>
  );
}
