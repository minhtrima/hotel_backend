import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MonthlyRevenueChart = ({ data, revenueType = "actual" }) => {
  const monthNames = [
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "T11",
    "T12",
  ];

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const chartData =
    revenueType === "projected"
      ? data.map((item) => ({
          date: formatDateLabel(item.date),
          fullDate: item.date,
          revenue: item.totalRevenue,
          bookings: item.totalBookings,
          averageValue: item.averageBookingValue,
        }))
      : data.map((item) => ({
          month: monthNames[item.month - 1],
          revenue: item.totalRevenue,
          bookings: item.totalBookings,
          averageValue: item.averageBookingValue,
        }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatTooltip = (value, name) => {
    if (name === "revenue") {
      return [formatCurrency(value), "Doanh thu"];
    }
    if (name === "bookings") {
      return [value, "Số booking"];
    }
    if (name === "averageValue") {
      return [formatCurrency(value), "Giá trị TB/booking"];
    }
    return [value, name];
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalBookings = data.reduce((sum, item) => sum + item.totalBookings, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">
            {revenueType === "projected"
              ? "Tổng doanh thu dự kiến"
              : "Tổng doanh thu"}
          </div>
          <div className="text-xl font-bold text-blue-600">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">
            {revenueType === "projected"
              ? "Tổng booking dự kiến"
              : "Tổng booking"}
          </div>
          <div className="text-xl font-bold text-green-600">
            {totalBookings.toLocaleString("vi-VN")}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={revenueType === "projected" ? "date" : "month"} />
          <YAxis
            tickFormatter={(value) => (value / 1000000).toFixed(1) + "M"}
          />
          <Tooltip formatter={formatTooltip} />
          <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
        </BarChart>
      </ResponsiveContainer>

      {/* Monthly breakdown */}
      <div className="mt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Chi tiết theo tháng:
        </div>
        <div className="grid grid-cols-6 gap-2 text-xs">
          {data
            .filter((item) => item.totalRevenue > 0)
            .map((item) => (
              <div
                key={item.month}
                className="bg-gray-50 p-2 rounded text-center"
              >
                <div className="font-medium">{monthNames[item.month - 1]}</div>
                <div className="text-blue-600">
                  {(item.totalRevenue / 1000000).toFixed(1)}M
                </div>
                <div className="text-gray-500">
                  {item.totalBookings} booking
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MonthlyRevenueChart;
