import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function InventorySlipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlipDetail();
  }, [id]);

  const fetchSlipDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory-slips?_id=${id}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setSlip(data.data[0]);
      } else {
        alert("Không tìm thấy phiếu");
        navigate("/inventory/receipt");
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết phiếu:", error);
      alert("Không thể tải chi tiết phiếu");
      navigate("/inventory/receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSlip = async () => {
    if (
      !window.confirm(
        "Bạn có chắc muốn hủy phiếu này? Hành động này sẽ hoàn trả vật tư về kho."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory-slips/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Đã hủy phiếu và hoàn kho thành công");
        fetchSlipDetail();
      } else {
        alert(data.error || "Không thể hủy phiếu");
      }
    } catch (error) {
      console.error("Lỗi hủy phiếu:", error);
      alert("Không thể hủy phiếu");
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      REFILL: "Bổ sung",
      REPLACEMENT: "Thay thế",
      EMERGENCY: "Khẩn cấp",
    };
    return types[type] || type;
  };

  const getTypeBadge = (type) => {
    const colors = {
      REFILL: "bg-blue-100 text-blue-800",
      REPLACEMENT: "bg-yellow-100 text-yellow-800",
      EMERGENCY: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 ${colors[type]} rounded-full text-sm font-medium`}
      >
        {getTypeLabel(type)}
      </span>
    );
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  if (!slip) {
    return <div className="p-6">Không tìm thấy phiếu</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate("/inventory/receipt")}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Quay lại danh sách
        </button>
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-gray-800">
            Chi tiết phiếu vật tư
          </h1>

          <button
            onClick={handleCancelSlip}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Hủy phiếu
          </button>
        </div>
      </div>

      {/* Thông tin chung */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4 pb-2 border-b">
          Thông tin chung
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Mã phiếu</p>
            <p className="font-medium">{slip._id}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Phòng</p>
            <p className="font-medium text-lg">
              {slip.roomId?.roomNumber || "Không liên kết"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Loại phiếu</p>
            <div>{getTypeBadge(slip.type)}</div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Nhân viên thực hiện</p>
            <p className="font-medium">{slip.staffId?.name || "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Công việc liên quan</p>
            <p className="font-medium">
              {slip.taskId?.title || "Không liên kết"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mt-5">
          <div>
            <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
            <p className="font-medium">
              {new Date(slip.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Cập nhật lần cuối</p>
            <p className="font-medium">
              {new Date(slip.updatedAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      </div>

      {/* Danh sách vật tư */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4 pb-2 border-b">
          Danh sách vật tư ({slip.items?.length || 0})
        </h2>
        {slip.items && slip.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-3 text-left">STT</th>
                  <th className="border px-4 py-3 text-left">Tên vật tư</th>
                  <th className="border px-4 py-3 text-center">Phân loại</th>
                  <th className="border px-4 py-3 text-center">Loại</th>
                  <th className="border px-4 py-3 text-center">Đơn vị</th>
                  <th className="border px-4 py-3 text-center">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {slip.items.map((item, index) => (
                  <tr key={item._id || index} className="hover:bg-gray-50">
                    <td className="border px-4 py-3">{index + 1}</td>
                    <td className="border px-4 py-3 font-medium">
                      {item.inventoryId?.name || "N/A"}
                    </td>
                    <td className="border px-4 py-3 text-center">
                      <span className="text-sm">
                        {item.inventoryId?.category === "LINEN" && "Vải lanh"}
                        {item.inventoryId?.category === "TOILETRY" &&
                          "Đồ vệ sinh"}
                        {item.inventoryId?.category === "CLEANING" && "Vệ sinh"}
                        {item.inventoryId?.category === "OTHER" && "Khác"}
                      </span>
                    </td>
                    <td className="border px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.inventoryId?.type === "CONSUMABLE"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.inventoryId?.type === "CONSUMABLE"
                          ? "Tiêu hao"
                          : "Luân chuyển"}
                      </span>
                    </td>
                    <td className="border px-4 py-3 text-center">
                      {item.inventoryId?.unit || "N/A"}
                    </td>
                    <td className="border px-4 py-3 text-center font-semibold">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan="5"
                    className="border px-4 py-3 text-right font-bold"
                  >
                    Tổng số mặt hàng:
                  </td>
                  <td className="border px-4 py-3 text-center font-bold">
                    {slip.items.length}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan="5"
                    className="border px-4 py-3 text-right font-bold"
                  >
                    Tổng số lượng:
                  </td>
                  <td className="border px-4 py-3 text-center font-bold">
                    {slip.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Không có vật tư nào trong phiếu
          </p>
        )}
      </div>
    </div>
  );
}
