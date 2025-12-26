import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const RoomTypeRevenueChart = ({ data }) => {
  const colors = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const chartData = data.map((item) => ({
    name: item._id.typeName,
    revenue: item.totalRevenue,
    bookings: item.totalBookings,
    averagePrice: item.averagePrice,
  }));

  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);

  const pieData = chartData.map((item) => ({
    name: item.name,
    value: item.revenue,
    percentage: ((item.revenue / totalRevenue) * 100).toFixed(1),
  }));

  const renderTooltip = (props) => {
    if (props.active && props.payload) {
      const data = props.payload[0];
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-blue-600">
            Doanh thu: {formatCurrency(data.payload.value)}
          </p>
          <p className="text-gray-600">Tỉ lệ: {data.payload.percentage}%</p>
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
          <h4 className="text-md font-medium mb-3">Phân bố doanh thu</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={renderTooltip} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-3">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center mb-1">
                <div
                  className="w-3 h-3 mr-2"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm">
                  {entry.name} ({entry.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="text-md font-medium mb-3">So sánh doanh thu</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(value) => (value / 1000000).toFixed(1) + "M"}
              />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), "Doanh thu"]}
              />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Chi tiết theo loại phòng</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Loại phòng
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Doanh thu
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Số booking
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Giá TB/đêm
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Tỉ lệ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700">
                    {item.bookings}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700">
                    {formatCurrency(item.averagePrice)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700">
                    {((item.revenue / totalRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomTypeRevenueChart;
