import React, { useEffect, useState } from "react";
import {
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiDollarSign,
} from "react-icons/fi";
import axios from "axios";
import BookingStatsChart from "../components/BookingStatsChart";
import OccupancyChart from "../components/OccupancyChart";
import MonthlyRevenueChart from "../components/MonthlyRevenueChart";
import RevenueByRoomTypeChart from "../components/RevenueByRoomTypeChart";
import TopServicesChart from "../components/TopServicesChart";
import LoadingPage from "../components/Loading";

const Statistics = () => {
  const [loading, setLoading] = useState(true); // Initial page loading
  const [loadingStates, setLoadingStates] = useState({
    dashboard: false,
    booking: false,
    occupancy: false,
    revenue: false,
    roomType: false,
    services: false,
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [bookingStats, setBookingStats] = useState([]);
  const [occupancyData, setOccupancyData] = useState({
    totalRooms: 0,
    occupancyData: [],
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [roomTypeRevenue, setRoomTypeRevenue] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  // Separate filters for each component
  const [bookingFilters, setBookingFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    period: "month",
  });

  const [occupancyFilters, setOccupancyFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    roomTypeId: "",
  });

  const [revenueFilters, setRevenueFilters] = useState({
    year: new Date().getFullYear(),
    revenueType: "actual",
    projectedDays: 7,
  });

  const [roomTypeFilters, setRoomTypeFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
  });

  const [servicesFilters, setServicesFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
  });

  // Separate fetch functions for each component
  const fetchDashboard = async () => {
    setLoadingStates((prev) => ({ ...prev, dashboard: true }));
    try {
      const dashboardResponse = await axios.get("/api/statistics/dashboard");
      setDashboardData(dashboardResponse.data.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, dashboard: false }));
    }
  };

  const fetchBookingStats = async () => {
    setLoadingStates((prev) => ({ ...prev, booking: true }));
    try {
      const bookingResponse = await axios.get("/api/statistics/bookings", {
        params: {
          period: bookingFilters.period,
          year: bookingFilters.year,
          month: bookingFilters.month,
        },
      });
      setBookingStats(bookingResponse.data.data);
    } catch (error) {
      console.error("Error fetching booking stats:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, booking: false }));
    }
  };

  const fetchOccupancy = async () => {
    setLoadingStates((prev) => ({ ...prev, occupancy: true }));
    try {
      const occupancyResponse = await axios.get("/api/statistics/occupancy", {
        params: {
          startDate: occupancyFilters.startDate || undefined,
          endDate: occupancyFilters.endDate || undefined,
          roomTypeId: occupancyFilters.roomTypeId || undefined,
        },
      });
      setOccupancyData(occupancyResponse.data.data);
    } catch (error) {
      console.error("Error fetching occupancy:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, occupancy: false }));
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await axios.get("/api/statistics/room-types");
      setRoomTypes(response.data.data);
    } catch (error) {
      console.error("Error fetching room types:", error);
    }
  };

  const fetchMonthlyRevenue = async () => {
    setLoadingStates((prev) => ({ ...prev, revenue: true }));
    try {
      const params =
        revenueFilters.revenueType === "actual"
          ? { year: revenueFilters.year, revenueType: "actual" }
          : {
              revenueType: "projected",
              projectedDays: revenueFilters.projectedDays,
            };

      const revenueResponse = await axios.get(
        "/api/statistics/revenue/monthly",
        { params }
      );
      setMonthlyRevenue(revenueResponse.data.data);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, revenue: false }));
    }
  };

  const fetchRoomTypeRevenue = async () => {
    setLoadingStates((prev) => ({ ...prev, roomType: true }));
    try {
      const roomTypeResponse = await axios.get(
        "/api/statistics/revenue/room-type",
        {
          params: {
            startDate: roomTypeFilters.startDate || undefined,
            endDate: roomTypeFilters.endDate || undefined,
          },
        }
      );
      setRoomTypeRevenue(roomTypeResponse.data.data);
    } catch (error) {
      console.error("Error fetching room type revenue:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, roomType: false }));
    }
  };

  const fetchTopServices = async () => {
    setLoadingStates((prev) => ({ ...prev, services: true }));
    try {
      const servicesResponse = await axios.get("/api/statistics/services/top", {
        params: {
          startDate: servicesFilters.startDate || undefined,
          endDate: servicesFilters.endDate || undefined,
          limit: 10,
        },
      });
      setTopServices(servicesResponse.data.data);
    } catch (error) {
      console.error("Error fetching top services:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, services: false }));
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboard(),
        fetchBookingStats(),
        fetchOccupancy(),
        fetchMonthlyRevenue(),
        fetchRoomTypeRevenue(),
        fetchTopServices(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchBookingStats();
    }
  }, [bookingFilters]);

  useEffect(() => {
    if (!loading) {
      fetchOccupancy();
    }
  }, [occupancyFilters]);

  useEffect(() => {
    if (!loading) {
      fetchMonthlyRevenue();
    }
  }, [revenueFilters]);

  useEffect(() => {
    if (!loading) {
      fetchRoomTypeRevenue();
    }
  }, [roomTypeFilters]);

  useEffect(() => {
    if (!loading) {
      fetchTopServices();
    }
  }, [servicesFilters]);

  const formatDate = (date) => {
    return date ? new Date(date).toISOString().split("T")[0] : "";
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thống kê & Báo cáo</h1>
        <p className="text-gray-600 mt-1">Tổng quan về hiệu quả kinh doanh</p>
      </div>

      {/* Dashboard Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center">
              <FiTrendingUp className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Booking tháng này</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.totalBookingsThisMonth}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center">
              <FiDollarSign className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Doanh thu tháng này</p>
                <p className="text-2xl font-bold text-green-600">
                  {(dashboardData.totalRevenueThisMonth / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center">
              <FiBarChart2 className="text-orange-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Tỉ lệ lấp phòng</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData.currentOccupancy.occupancyRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center">
              <FiPieChart className="text-purple-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600">Tổng số phòng</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.totalRooms}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Booking Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-lg relative">
          {loadingStates.booking && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
              <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Thống kê Booking
            </h3>
            <div className="flex justify-end gap-2">
              <select
                value={bookingFilters.year}
                onChange={(e) =>
                  setBookingFilters((prev) => ({
                    ...prev,
                    year: parseInt(e.target.value),
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {bookingFilters.period === "day" && (
                <select
                  value={bookingFilters.month}
                  onChange={(e) =>
                    setBookingFilters((prev) => ({
                      ...prev,
                      month: parseInt(e.target.value),
                    }))
                  }
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      Tháng {month}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={bookingFilters.period}
                onChange={(e) =>
                  setBookingFilters((prev) => ({
                    ...prev,
                    period: e.target.value,
                    month:
                      e.target.value === "day"
                        ? new Date().getMonth() + 1
                        : prev.month,
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="month">Theo tháng</option>
                <option value="day">Theo ngày</option>
              </select>
            </div>
          </div>
          <BookingStatsChart
            data={bookingStats}
            period={bookingFilters.period}
          />
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-6 rounded-lg shadow-lg relative">
          {loadingStates.occupancy && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
              <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tỉ lệ lấp phòng
            </h3>
            <div className="flex justify-end gap-2">
              <select
                value={occupancyFilters.roomTypeId}
                onChange={(e) =>
                  setOccupancyFilters((prev) => ({
                    ...prev,
                    roomTypeId: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">Tất cả loại phòng</option>
                {roomTypes.map((roomType) => (
                  <option key={roomType._id} value={roomType._id}>
                    {roomType.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={formatDate(occupancyFilters.startDate)}
                onChange={(e) =>
                  setOccupancyFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Từ ngày"
              />
              <input
                type="date"
                value={formatDate(occupancyFilters.endDate)}
                onChange={(e) =>
                  setOccupancyFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Đến ngày"
              />
            </div>
          </div>
          <OccupancyChart
            data={occupancyData.occupancyData}
            totalRooms={occupancyData.totalRooms}
          />
        </div>
      </div>

      {/* Monthly Revenue - Full Width */}
      <div className="bg-white p-6 rounded-lg shadow-lg relative">
        {loadingStates.revenue && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
            <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        )}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {revenueFilters.revenueType === "actual"
              ? "Doanh thu thực tế"
              : "Doanh thu dự kiến"}
          </h3>
          <div className="flex justify-end gap-2">
            <select
              value={revenueFilters.revenueType}
              onChange={(e) =>
                setRevenueFilters((prev) => ({
                  ...prev,
                  revenueType: e.target.value,
                }))
              }
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="actual">Doanh thu thực tế</option>
              <option value="projected">Doanh thu dự kiến</option>
            </select>
            {revenueFilters.revenueType === "actual" ? (
              <select
                value={revenueFilters.year}
                onChange={(e) =>
                  setRevenueFilters((prev) => ({
                    ...prev,
                    year: parseInt(e.target.value),
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={revenueFilters.projectedDays}
                onChange={(e) =>
                  setRevenueFilters((prev) => ({
                    ...prev,
                    projectedDays: parseInt(e.target.value),
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={7}>7 ngày tới</option>
                <option value={14}>14 ngày tới</option>
                <option value={30}>30 ngày tới</option>
              </select>
            )}
          </div>
        </div>
        <MonthlyRevenueChart
          data={monthlyRevenue}
          revenueType={revenueFilters.revenueType}
        />
      </div>

      {/* Revenue by Room Type and Top Services */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg relative">
          {loadingStates.roomType && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
              <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Doanh thu theo loại phòng
            </h3>
            <div className="flex justify-end gap-2">
              <input
                type="date"
                value={formatDate(roomTypeFilters.startDate)}
                onChange={(e) =>
                  setRoomTypeFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Từ ngày"
              />
              <input
                type="date"
                value={formatDate(roomTypeFilters.endDate)}
                onChange={(e) =>
                  setRoomTypeFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Đến ngày"
              />
            </div>
          </div>
          <RevenueByRoomTypeChart data={roomTypeRevenue} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg relative">
          {loadingStates.services && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
              <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Top dịch vụ
            </h3>
            <div className="flex justify-end gap-2">
              <input
                type="date"
                value={formatDate(servicesFilters.startDate)}
                onChange={(e) =>
                  setServicesFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Từ ngày"
              />
              <input
                type="date"
                value={formatDate(servicesFilters.endDate)}
                onChange={(e) =>
                  setServicesFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Đến ngày"
              />
            </div>
          </div>
          <TopServicesChart data={topServices} />
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <LoadingPage />
            <p className="text-center mt-4 text-gray-600">
              Đang tải dữ liệu thống kê...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
