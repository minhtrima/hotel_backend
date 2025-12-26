import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoArrowRight } from "react-icons/go";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";

const formatDateforInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

export default function Booking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBookings = async (status = "") => {
    setLoading(true);
    const response = await fetch("/api/booking");
    if (!response.ok) throw new Error("Failed to fetch bookings");
    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch bookings");

    return data.bookings
      .map((booking) => {
        if (booking.status != "pending") {
          console.log(booking);
          // Kiểm tra nếu có nhiều loại phòng hoặc nhiều roomid
          let roomLabel = "";
          let allRooms = [];
          if (booking.rooms.length > 1) {
            roomLabel = "Nhiều phòng";
            allRooms = booking.rooms.map(
              (room) => room.roomSnapshot?.roomType || "Chưa chỉ định"
            );
          } else {
            roomLabel = booking.rooms
              .map((room) => room.roomSnapshot?.roomNumber || "Chưa chỉ định")
              .join(", ");
          }

          return {
            id: booking._id,
            customerLastName: booking.customerSnapshot?.lastName || "Không rõ",
            customerFirstName:
              booking.customerSnapshot?.firstName || "Không rõ",
            roomLabel,
            rooms: booking.rooms,
            _allRooms: allRooms,
            expectedCheckInDate: booking.rooms[0]?.expectedCheckInDate,
            expectedCheckOutDate: booking.rooms[0]?.expectedCheckOutDate,
            actualCheckInDate: booking.rooms[0]?.actualCheckInDate,
            actualCheckOutDate: booking.rooms[0]?.actualCheckOutDate,
            numberOfGuests: booking.rooms.reduce(
              (total, room) =>
                total +
                (room.numberOfAdults || 1) +
                (room.numberOfChildren || 0),
              0
            ),
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            identificationNumber:
              booking.customerSnapshot?.identificationNumber || "",
          };
        } else {
          return null;
        }
      })
      .filter(Boolean)
      .filter((booking) => !status || booking.status === status);
  };

  useEffect(() => {
    fetchBookings(statusFilter)
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading bookings:", err);
        setError("Không thể tải dữ liệu đặt phòng.");
        setLoading(false);
      });
  }, [statusFilter]);

  const columns = [
    { header: "Họ", accessorKey: "customerLastName" },
    { header: "Tên", accessorKey: "customerFirstName" },

    {
      header: "Phòng",
      accessorKey: "roomLabel",
      cell: ({ row }) => {
        const label = row.original.roomLabel;
        // Nếu là nhiều phòng
        if (label === "Nhiều phòng") {
          let roomNumbers = [];
          let typeNames = [];

          if (row.original.rooms) {
            roomNumbers = row.original.rooms.map(
              (room) => room.roomSnapshot?.roomNumber || "Chưa chỉ định"
            );
            typeNames = row.original.rooms.map(
              (room) =>
                room.roomSnapshot?.type ||
                room.roomSnapshot?.typeName ||
                room.desiredRoomTypeId?.name ||
                "Không rõ loại"
            );
          } else if (row.original._allRooms) {
            roomNumbers = row.original._allRooms;
          }
          return (
            <div className="relative group cursor-pointer">
              <span className="underline decoration-dotted">
                {row.original.rooms?.length || roomNumbers.length} phòng
              </span>
              <div className="absolute left-0 z-10 hidden group-hover:block bg-white border border-gray-300 rounded shadow-lg p-2 min-w-max text-sm text-gray-800 whitespace-nowrap">
                {roomNumbers.length > 0
                  ? roomNumbers.map((num, idx) =>
                      num === "Chưa chỉ định" ? (
                        <div key={idx}>
                          {typeNames[idx] ? `${typeNames[idx]}` : ""}
                        </div>
                      ) : (
                        <div key={idx}>
                          {num} ({typeNames[idx] || "Không rõ loại"})
                        </div>
                      )
                    )
                  : "Không có thông tin phòng"}
              </div>
            </div>
          );
        }
        // Nếu chỉ 1 phòng, nếu không có roomNumber, hiển thị "Chưa chỉ định" với hover loại phòng
        if (
          row.original.rooms &&
          row.original.rooms.length === 1 &&
          !row.original.rooms[0].roomSnapshot?.roomNumber
        ) {
          const typeName =
            row.original.rooms[0].roomSnapshot?.type ||
            row.original.rooms[0].roomSnapshot?.typeName ||
            row.original.rooms[0].desiredRoomTypeId?.name ||
            "";
          return (
            <div className="relative group">
              {typeName && <div>{typeName}</div>}
            </div>
          );
        }
        return <span>{label}</span>;
      },
    },
    {
      header: "Nhận phòng",
      accessorKey: "actualCheckInDate",
      cell: ({ row }) => {
        const actual = row.original.actualCheckInDate;
        const date = actual;

        return formatDateforInput(date);
      },
    },
    {
      header: "Trả phòng",
      accessorKey: "actualCheckOutDate",
      cell: ({ row }) => {
        const actual = row.original.actualCheckOutDate;
        const date = actual;

        return formatDateforInput(date);
      },
    },

    {
      header: "Trạng thái",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const value = getValue();
        let label = "";
        let color = "";

        switch (value) {
          case "booked":
            label = "Đã đặt";
            color = "bg-yellow-100 text-yellow-800";
            break;
          case "checked_in":
            label = "Đã nhận phòng";
            color = "bg-blue-100 text-blue-800";
            break;
          case "cancelled":
            label = "Đã hủy";
            color = "bg-red-100 text-red-800";
            break;
          case "completed":
            label = "Hoàn tất";
            color = "bg-green-100 text-green-800";
            break;
          default:
            label = value;
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
      header: "Thanh toán",
      accessorKey: "paymentStatus",
      cell: ({ getValue }) => {
        return getValue() === "paid" ? "Đã thanh toán" : "Chưa thanh toán";
      },
    },
    {
      header: "Thao tác",
      id: "arrow",
      cell: ({ row }) => {
        return (
          <div
            className="ml-auto cursor-pointer"
            onClick={() => navigate("/booking/" + row.original.id)}
          >
            <GoArrowRight className="w-5 h-5 text-gray-500" />
          </div>
        );
      },
    },
    // Hidden column for identificationNumber (for search/filter only)
    {
      header: "",
      accessorKey: "identificationNumber",
      enableHiding: true,
      enableSorting: false,
      cell: () => null,
      meta: { hidden: true }, // for custom DataTable logic if needed
    },
  ];

  const reloadBookings = async () => {
    setLoading(true);
    try {
      const data = await fetchBookings(statusFilter);
      setBookings(data);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Không thể tải dữ liệu đặt phòng.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: bookings.length,
    booked: bookings.filter((booking) => booking.status === "booked").length,
    checkedIn: bookings.filter((booking) => booking.status === "checked_in")
      .length,
    completed: bookings.filter((booking) => booking.status === "completed")
      .length,
    paid: bookings.filter((booking) => booking.paymentStatus === "paid").length,
  };

  const extraHeaderContent = (
    <div className="flex space-x-3">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="booked">Đã đặt</option>
        <option value="checked_in">Đã nhận phòng</option>
        <option value="completed">Hoàn tất</option>
        <option value="cancelled">Đã hủy</option>
      </select>
      <button
        onClick={reloadBookings}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer"
      >
        Tải lại trang
      </button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý đặt phòng
          </h1>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span>
              Tổng: <strong>{stats.total}</strong>
            </span>
            <span className="text-blue-600">
              Đã đặt: <strong>{stats.booked}</strong>
            </span>
            <span className="text-yellow-600">
              Đã nhận: <strong>{stats.checkedIn}</strong>
            </span>
            <span className="text-green-600">
              Hoàn tất: <strong>{stats.completed}</strong>
            </span>
            <span className="text-purple-600">
              Đã thanh toán: <strong>{stats.paid}</strong>
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

          {bookings.length === 0 ? (
            <p className="text-center text-gray-500">
              {statusFilter
                ? "Không có đặt phòng nào với trạng thái này."
                : "Không có đặt phòng nào."}
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={bookings}
              extraHeaderContent={null}
            />
          )}
        </>
      )}
    </div>
  );
}
