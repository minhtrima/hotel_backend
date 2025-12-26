import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const OccupancyChart = ({ data, totalRooms }) => {
  const formatData = (rawData) => {
    return rawData.map((item) => ({
      date: item.date, // yyyy-mm-dd
      occupancyRate: item.occupancyRate,
      occupiedRooms: item.occupiedRoomsCount,
      availableRooms: totalRooms - item.occupiedRoomsCount,
    }));
  };

  const chartData = formatData(data);

  const formatTooltip = (value, name) => {
    if (name === "occupancyRate") {
      return [`${value.toFixed(1)}%`, "Tỉ lệ lấp phòng"];
    }
    return [
      value,
      name === "occupiedRooms" ? "Phòng đã book" : "Phòng còn trống",
    ];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Tỉ lệ lấp phòng</h3>
      <div className="mb-4 text-sm text-gray-600">
        Tổng số phòng: {totalRooms}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={formatTooltip} />
          <Area
            type="monotone"
            dataKey="occupancyRate"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm text-gray-600">Tỉ lệ TB</div>
          <div className="text-lg font-semibold text-blue-600">
            {chartData.length > 0
              ? (
                  chartData.reduce((sum, item) => sum + item.occupancyRate, 0) /
                  chartData.length
                ).toFixed(1)
              : 0}
            %
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-sm text-gray-600">Cao nhất</div>
          <div className="text-lg font-semibold text-green-600">
            {chartData.length > 0
              ? Math.max(
                  ...chartData.map((item) => item.occupancyRate)
                ).toFixed(1)
              : 0}
            %
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <div className="text-sm text-gray-600">Thấp nhất</div>
          <div className="text-lg font-semibold text-orange-600">
            {chartData.length > 0
              ? Math.min(
                  ...chartData.map((item) => item.occupancyRate)
                ).toFixed(1)
              : 0}
            %
          </div>
        </div>
      </div>
    </div>
  );
};

export default OccupancyChart;
