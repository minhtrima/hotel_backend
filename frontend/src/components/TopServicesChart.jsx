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

const TopServicesChart = ({ data }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const chartData = data.slice(0, 10).map((item) => ({
    name: item._id.serviceName,
    revenue: item.totalRevenue,
    quantity: item.totalQuantity,
    timesOrdered: item.timesOrdered,
    averagePrice: item.averagePrice,
    category: item._id.category,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Doanh thu: {formatCurrency(data.revenue)}
          </p>
          <p className="text-green-600">Tổng số lượng: {data.quantity}</p>
          <p className="text-orange-600">Số lần đặt: {data.timesOrdered}</p>
          <p className="text-purple-600">
            Giá TB: {formatCurrency(data.averagePrice)}
          </p>
          <p className="text-gray-600 text-sm">Loại: {data.category}</p>
        </div>
      );
    }
    return null;
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Top Dịch vụ</h3>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Tổng doanh thu</div>
          <div className="text-lg font-bold text-blue-600">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Số dịch vụ</div>
          <div className="text-lg font-bold text-green-600">{data.length}</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Tổng lượt đặt</div>
          <div className="text-lg font-bold text-orange-600">
            {data.reduce((sum, item) => sum + item.timesOrdered, 0)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value) => (value / 1000000).toFixed(1) + "M"}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      {/* Top services list */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-700 mb-3">
          Chi tiết top dịch vụ:
        </h4>
        <div className="space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div
              key={item._id.serviceId}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{item._id.serviceName}</div>
                  <div className="text-xs text-gray-500">
                    {item._id.category} • {item.timesOrdered} lần đặt •{" "}
                    {item.totalQuantity} sản phẩm
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-blue-600">
                  {formatCurrency(item.totalRevenue)}
                </div>
                <div className="text-xs text-gray-500">
                  TB: {formatCurrency(item.averagePrice)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopServicesChart;
