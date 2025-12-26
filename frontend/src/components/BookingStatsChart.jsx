import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BookingStatsChart = ({ data, period = "month" }) => {
  const formatData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      console.log("No data to format");
      return [];
    }

    return rawData.map((item) => ({
      period:
        period === "day"
          ? `${item._id.day}/${item._id.month}`
          : `${item._id.month}/${item._id.year}`,
      totalBookings: item.totalBookings || 0,
      completedBookings: item.completedBookings || 0,
      cancelledBookings: item.cancelledBookings || 0,
      pendingBookings: item.pendingBookings || 0,
      bookedBookings: item.bookedBookings || 0,
      checkedInBookings: item.checkedInBookings || 0,
      revenue: item.totalRevenue || 0,
    }));
  };

  const chartData = formatData(data);

  // Show message if no data
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">
          Thống kê Booking theo {period === "day" ? "ngày" : "tháng"}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p>Không có dữ liệu booking</p>
            <p className="text-sm mt-2">
              Vui lòng kiểm tra lại khoảng thời gian hoặc tạo booking mới
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">
        Thống kê Booking theo {period === "day" ? "ngày" : "tháng"}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalBookings"
            stroke="#8884d8"
            name="Tổng booking"
          />
          <Line
            type="monotone"
            dataKey="completedBookings"
            stroke="#82ca9d"
            name="Hoàn thành"
          />
          <Line
            type="monotone"
            dataKey="bookedBookings"
            stroke="#ffc658"
            name="Đã book"
          />
          <Line
            type="monotone"
            dataKey="checkedInBookings"
            stroke="#ff7c7c"
            name="Đã check-in"
          />
          <Line
            type="monotone"
            dataKey="cancelledBookings"
            stroke="#ff7300"
            name="Hủy bỏ"
          />
          <Line
            type="monotone"
            dataKey="pendingBookings"
            stroke="#a78bfa"
            name="Chờ xử lý"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div className="bg-blue-50 p-3 rounded text-center">
          <div className="font-medium text-blue-600">
            {chartData.reduce((sum, item) => sum + item.totalBookings, 0)}
          </div>
          <div className="text-gray-600">Tổng booking</div>
        </div>
        <div className="bg-green-50 p-3 rounded text-center">
          <div className="font-medium text-green-600">
            {chartData.reduce((sum, item) => sum + item.completedBookings, 0)}
          </div>
          <div className="text-gray-600">Hoàn thành</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded text-center">
          <div className="font-medium text-yellow-600">
            {chartData.reduce((sum, item) => sum + item.bookedBookings, 0)}
          </div>
          <div className="text-gray-600">Đã book</div>
        </div>
        <div className="bg-orange-50 p-3 rounded text-center">
          <div className="font-medium text-orange-600">
            {chartData.reduce((sum, item) => sum + item.cancelledBookings, 0)}
          </div>
          <div className="text-gray-600">Hủy bỏ</div>
        </div>
        <div className="bg-purple-50 p-3 rounded text-center">
          <div className="font-medium text-purple-600">
            {chartData.reduce((sum, item) => sum + item.pendingBookings, 0)}
          </div>
          <div className="text-gray-600">Chờ xử lý</div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatsChart;
