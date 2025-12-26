import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { GoArrowRight } from "react-icons/go";

export default function Room() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRoomData = async () => {
    setLoading(true);
    const response = await fetch("/api/room");
    if (!response.ok) throw new Error("Failed to fetch room data");

    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch room data");

    console.log("Room data:", data.rooms);

    return data.rooms.map((room) => ({
      id: room._id,
      roomNumber: room.roomNumber,
      typeName: room.typeid?.name,
      typeId: room.typeid?._id,
      floor: room.floor,
      capacity: room.typeid?.capacity,
      status: room.status,
      pricePerNight: room.typeid?.pricePerNight,
    }));
  };

  useEffect(() => {
    fetchRoomData()
      .then((data) => {
        console.log("Fetched rooms:", data);
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load rooms:", err);
        setError("Không thể tải dữ liệu phòng.");
        setLoading(false);
      });
  }, []);

  const reloadRooms = async () => {
    setLoading(true);
    try {
      const data = await fetchRoomData();
      setRooms(data);
    } catch (err) {
      console.error("Failed to load rooms:", err);
      setError("Không thể tải dữ liệu phòng.");
    } finally {
      setLoading(false);
    }
  };

  const extraHeaderContent = (
    <div className="flex space-x-3">
      <button
        onClick={() => navigate("/type")}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Loại phòng
      </button>
      <button
        onClick={() => navigate("/room/add")}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
      >
        <span>+ Thêm phòng</span>
      </button>
      <button
        onClick={reloadRooms}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tải lại
      </button>
    </div>
  );

  // Calculate stats
  const stats = {
    total: rooms.length,
    available: rooms.filter((room) => room.status === "available").length,
    occupied: rooms.filter((room) => room.status === "occupied").length,
    needCleaning: rooms.filter((room) => room.status === "need_cleaning")
      .length,
  };

  const columns = [
    { header: "Số phòng", accessorKey: "roomNumber" },
    {
      header: "Loại phòng",
      accessorKey: "typeName",
      cell: ({ row }) => {
        const typeName = row.original.typeName;
        const typeId = row.original.typeId;
        return (
          <>
            <span
              className="text-blue-600 hover:underline cursor-pointer"
              onClick={() => navigate("/type/" + typeId)}
            >
              {typeName}
            </span>
          </>
        );
      },
    },
    { header: "Tầng", accessorKey: "floor" },
    {
      header: "Tình trạng",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const status = getValue();
        switch (status) {
          case "available":
            return <span className="text-green-600 font-semibold">Trống</span>;
          case "occupied":
            return <span className="text-red-500 font-semibold">Đang ở</span>;
          case "reserved":
            return (
              <span className="text-yellow-500 font-semibold">
                Chờ nhận phòng
              </span>
            );
          case "need_cleaning":
            return <span className="text-blue-500 font-semibold">Cần dọn</span>;
          default:
            return <span className="text-gray-500">Không rõ</span>;
        }
      },
    },
    {
      header: "Sức chứa",
      accessorKey: "capacity",
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? `${value} người` : "Không rõ";
      },
    },
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
        const roomId = row.original.id;
        return (
          <div
            className="ml-auto cursor-pointer"
            onClick={() => navigate("/room/" + roomId)}
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
          <h1 className="text-2xl font-bold text-gray-800">Quản lý phòng</h1>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span>
              Tổng: <strong>{stats.total}</strong>
            </span>
            <span className="text-green-600">
              Trống: <strong>{stats.available}</strong>
            </span>
            <span className="text-red-500">
              Đang ở: <strong>{stats.occupied}</strong>
            </span>
            <span className="text-blue-500">
              Cần dọn: <strong>{stats.needCleaning}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : rooms.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Không có phòng nào.</p>
          <button
            onClick={() => navigate("/room/add")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2 mx-auto"
          >
            <span>+ Thêm phòng đầu tiên</span>
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rooms}
          extraHeaderContent={extraHeaderContent}
        />
      )}
    </div>
  );
}
