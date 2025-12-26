import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const RevenueByRoomTypeChart = ({ data }) => {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const chartData = data.map((item, index) => ({
    name: item._id.typeName,
    value: item.totalRevenue,
    color: COLORS[index % COLORS.length],
    bookings: item.totalBookings,
    averagePrice: item.averagePrice,
  }));

  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-blue-600">
            Doanh thu: {formatCurrency(data.value)}
          </p>
          <p className="text-green-600">Số booking: {data.bookings}</p>
          <p className="text-orange-600">
            Giá TB/đêm: {formatCurrency(data.averagePrice)}
          </p>
          <p className="text-purple-600">
            Tỉ lệ: {((data.value / totalRevenue) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Doanh thu theo loại phòng</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics Table */}
        <div>
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Thống kê chi tiết:
            </div>
            {data.map((item, index) => (
              <div
                key={item._id.typeId}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div>
                    <div className="font-medium">{item._id.typeName}</div>
                    <div className="text-xs text-gray-500">
                      {item.totalBookings} booking
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-blue-600">
                    {formatCurrency(item.totalRevenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((item.totalRevenue / totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">Tổng doanh thu</div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueByRoomTypeChart;
