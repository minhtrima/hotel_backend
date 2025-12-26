import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function InventorySlipAdd() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStaff, setCurrentStaff] = useState(null);

  // State cho autocomplete
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const [formData, setFormData] = useState({
    roomId: "",
    taskId: "",
    type: "REFILL",
    items: [],
    note: "",
  });

  const [selectedInventory, setSelectedInventory] = useState("");
  const [selectedInventoryName, setSelectedInventoryName] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedCondition, setSelectedCondition] = useState("GOOD");

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý click outside để đóng suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter suggestions khi searchTerm thay đổi
  useEffect(() => {
    const filterAvailableInventories = () => {
      let available = inventories.filter(
        (inv) => !formData.items.find((item) => item.inventoryId === inv._id)
      );

      // Nếu type là MINIBAR, chỉ hiển thị inventory có category MINIBAR
      if (formData.type === "MINIBAR") {
        available = available.filter((inv) => inv.category === "MINIBAR");
      } else {
        // Nếu không phải MINIBAR, loại bỏ inventory MINIBAR
        available = available.filter((inv) => inv.category !== "MINIBAR");
      }

      if (searchTerm.trim() === "") {
        // Khi searchTerm rỗng, hiển thị tất cả inventory có sẵn
        setFilteredSuggestions(available);
      } else {
        // Khi có searchTerm, filter theo từ khóa
        const filtered = available.filter((inv) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            inv.name.toLowerCase().includes(searchLower) ||
            inv.category.toLowerCase().includes(searchLower) ||
            (inv.description &&
              inv.description.toLowerCase().includes(searchLower))
          );
        });

        setFilteredSuggestions(filtered);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      }
    };

    filterAvailableInventories();
  }, [searchTerm, inventories, formData.items]);

  // Xử lý keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const selectSuggestion = (inventory) => {
    setSelectedInventory(inventory._id);
    setSelectedInventoryName(inventory.name);
    setSearchTerm(inventory.name);
    setShowSuggestions(false);

    // Tự động set condition thành USED nếu là vật tư tiêu hao
    if (inventory.type === "CONSUMABLE") {
      setSelectedCondition("USED");
    } else {
      setSelectedCondition("GOOD");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Lấy staffId từ currentUser
      const staffId = currentUser?.user?.staffId?._id;
      if (!staffId) {
        alert("Không tìm thấy thông tin nhân viên.");
        return;
      }

      const [roomRes, taskRes, staffRes, inventoryRes] = await Promise.all([
        fetch("/api/room").then((res) => res.json()),
        fetch("/api/tasks").then((res) => res.json()),
        fetch(`/api/staff/${staffId}`).then((res) => res.json()),
        fetch("/api/inventories").then((res) => res.json()),
      ]);

      console.log(roomRes);
      console.log(taskRes);
      setRooms(roomRes.rooms || []);
      setTasks(taskRes || []);
      setCurrentStaff(staffRes.data || currentUser.user.staffId);

      // Chỉ lấy inventories active
      const activeInventories = (inventoryRes || []).filter(
        (inv) => inv.isActive
      );
      setInventories(activeInventories);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      alert("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case "GOOD":
        return "Tốt";
      case "USED":
        return "Đã sử dụng";
      case "DIRTY":
        return "Bẩn";
      case "DAMAGED":
        return "Hư hỏng";
      case "LOST":
        return "Mất";
      default:
        return condition;
    }
  };

  const handleAddItem = () => {
    if (!selectedInventory || selectedQuantity < 1) {
      alert("Vui lòng chọn vật tư và số lượng hợp lệ");
      return;
    }

    const inventory = inventories.find((inv) => inv._id === selectedInventory);
    if (!inventory) {
      alert("Không tìm thấy vật tư");
      return;
    }

    if (selectedQuantity > inventory.quantity) {
      alert(
        `Không đủ tồn kho. Còn lại: ${inventory.quantity} ${inventory.unit}`
      );
      return;
    }

    const exists = formData.items.find(
      (item) => item.inventoryId === selectedInventory
    );
    if (exists) {
      alert("Vật tư đã được thêm");
      return;
    }

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          inventoryId: selectedInventory,
          name: inventory.name,
          unit: inventory.unit,
          category: inventory.category,
          inventoryType: inventory.type,
          availableQuantity: inventory.quantity,
          quantity: selectedQuantity,
          condition: selectedCondition,
        },
      ],
    });

    // Reset form thêm vật tư
    setSelectedInventory("");
    setSelectedInventoryName("");
    setSearchTerm("");
    setSelectedQuantity(1);
    setSelectedCondition("GOOD");
    setShowSuggestions(false);
  };

  const handleRemoveItem = (inventoryId) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.inventoryId !== inventoryId),
    });
  };

  const handleUpdateQuantity = (inventoryId, newQuantity) => {
    const item = formData.items.find((i) => i.inventoryId === inventoryId);
    if (newQuantity > item.availableQuantity) {
      alert(
        `Không đủ tồn kho. Còn lại: ${item.availableQuantity} ${item.unit}`
      );
      return;
    }

    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.inventoryId === inventoryId
          ? { ...item, quantity: newQuantity }
          : item
      ),
    });
  };

  const handleUpdateCondition = (inventoryId, newCondition) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.inventoryId === inventoryId
          ? { ...item, condition: newCondition }
          : item
      ),
    });
  };
  const handleSearchFocus = () => {
    if (!showSuggestions) {
      // Hiển thị tất cả inventory chưa được chọn
      let availableInventories = inventories.filter(
        (inv) => !formData.items.find((item) => item.inventoryId === inv._id)
      );

      // Nếu type là MINIBAR, chỉ hiển thị inventory có category MINIBAR
      if (formData.type === "MINIBAR") {
        availableInventories = availableInventories.filter(
          (inv) => inv.category === "MINIBAR"
        );
      } else {
        // Nếu không phải MINIBAR, loại bỏ inventory MINIBAR
        availableInventories = availableInventories.filter(
          (inv) => inv.category !== "MINIBAR"
        );
      }

      setFilteredSuggestions(availableInventories);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Phòng không bắt buộc nữa, chỉ cần kiểm tra có vật tư
    if (formData.items.length === 0) {
      alert("Vui lòng thêm ít nhất 1 vật tư");
      return;
    }

    const staffId = currentUser?.user?.staffId?._id;
    if (!staffId) {
      alert("Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const response = await fetch("/api/inventory-slips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: formData.roomId || undefined, // Có thể là undefined nếu không chọn phòng
          taskId: formData.taskId || undefined,
          staffId: staffId,
          type: formData.type,
          note: formData.note,
          items: formData.items.map((item) => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            condition: item.condition,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Tạo phiếu vật tư thành công");
        navigate("/inventory/receipt");
      } else {
        alert(data.error || "Không thể tạo phiếu");
      }
    } catch (error) {
      console.error("Lỗi tạo phiếu:", error);
      alert("Không thể tạo phiếu");
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tạo phiếu vật tư</h1>
        <button
          onClick={() => navigate("/inventory/receipt")}
          className="text-blue-600 hover:underline handle-2"
        >
          ← Quay lại danh sách
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2 font-medium">Phòng (tùy chọn)</label>
            <select
              value={formData.roomId}
              onChange={(e) =>
                setFormData({ ...formData, roomId: e.target.value })
              }
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Không chọn phòng --</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomNumber} - {room.typeid.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 handle-1">
              Chọn phòng nếu phiếu liên quan đến phòng cụ thể
            </p>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Công việc (tùy chọn)
            </label>
            <select
              value={formData.taskId}
              onChange={(e) =>
                setFormData({ ...formData, taskId: e.target.value })
              }
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Không liên kết --</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title} - {task.assignedTo?.name || "N/A"} -{" "}
                  {task.roomId?.roomNumber || "N/A"} -{" "}
                  {task.roomId?.typeid.name || "N/A"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Nhân viên thực hiện
            </label>
            <div className="w-full border px-3 py-2 rounded bg-gray-50">
              <p className="font-medium text-gray-700">
                {currentStaff?.name ||
                  currentUser?.user?.staffId?.name ||
                  "N/A"}{" "}
                -{" "}
                {currentStaff?.position ||
                  currentUser?.user?.staffId?.position ||
                  ""}
              </p>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Loại phiếu <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="REFILL">Bổ sung</option>
              <option value="INSPECTION">Kiểm tra</option>
              <option value="LOSS">Mất mát</option>
              <option value="DAMAGE">Hư hỏng</option>
              <option value="MINIBAR">Minibar</option>
            </select>
          </div>
        </div>

        {/* Ghi chú */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">Ghi chú (tùy chọn)</label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Nhập ghi chú cho phiếu vật tư..."
            rows="3"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 handle-1">
            Ghi chú về lý do, tình trạng hoặc thông tin bổ sung
          </p>
        </div>

        {/* Thêm vật tư với autocomplete */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Thêm vật tư</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[300px] relative" ref={searchInputRef}>
              <label className="block mb-2 font-medium">
                Tìm kiếm vật tư <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  ref={searchInputRef}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedInventory(""); // Reset selection khi tìm kiếm
                  }}
                  onFocus={handleSearchFocus} // Sử dụng hàm mới
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tên vật tư để tìm kiếm hoặc click để xem tất cả..."
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedInventory("");
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dropdown suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full handle-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto"
                >
                  {/* Hiển thị thông báo khi đang show tất cả */}
                  {searchTerm === "" && (
                    <div className="px-3 py-2 bg-gray-100 text-gray-600 text-sm border-b">
                      Tất cả vật tư có sẵn ({filteredSuggestions.length})
                    </div>
                  )}

                  {filteredSuggestions.map((inv, index) => (
                    <div
                      key={inv._id}
                      className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                        index === selectedSuggestionIndex
                          ? "bg-blue-100"
                          : "bg-white"
                      } ${
                        index !== filteredSuggestions.length - 1
                          ? "border-b"
                          : ""
                      }`}
                      onClick={() => selectSuggestion(inv)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                      <div className="font-medium">{inv.name}</div>
                      <div className="text-sm text-gray-600">
                        Phân loại:{" "}
                        {inv.category === "LINEN"
                          ? "Vải lanh"
                          : inv.category === "TOILETRY"
                          ? "Đồ vệ sinh"
                          : inv.category === "CLEANING"
                          ? "Vệ sinh"
                          : inv.category === "MINIBAR"
                          ? "Minibar"
                          : "Khác"}
                        {" • "}Tồn kho: {inv.quantity} {inv.unit}
                        {" • "}
                        <span
                          className={
                            inv.type === "CONSUMABLE"
                              ? "text-orange-600"
                              : "text-blue-600"
                          }
                        >
                          {inv.type === "CONSUMABLE"
                            ? "Tiêu hao"
                            : "Luân chuyển"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showSuggestions && filteredSuggestions.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg px-3 py-2 text-gray-500">
                  {searchTerm
                    ? "Không tìm thấy vật tư phù hợp"
                    : "Không có vật tư nào có sẵn"}
                </div>
              )}
            </div>

            <div className="w-32">
              <label className="block mb-2 font-medium">
                Số lượng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-48">
              <label className="block mb-2 font-medium">
                Tình trạng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GOOD">Tốt</option>
                <option value="USED">Đã sử dụng</option>
                <option value="DIRTY">Bẩn</option>
                <option value="DAMAGED">Hư hỏng</option>
                <option value="LOST">Mất</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedInventory || selectedQuantity < 1}
                className={`px-4 py-2 rounded transition ${
                  !selectedInventory || selectedQuantity < 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                + Thêm
              </button>
            </div>
          </div>

          {/* Hiển thị vật tư đã chọn */}
          {selectedInventory && (
            <div className="handle-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="font-medium text-blue-800">
                Vật tư đã chọn: {selectedInventoryName}
              </p>
            </div>
          )}
        </div>

        {/* Danh sách vật tư đã thêm */}
        {formData.items.length > 0 && (
          <div className="border-t pt-6 mb-6">
            <h3 className="font-bold text-lg mb-4">
              Danh sách vật tư ({formData.items.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-2 text-left">Tên vật tư</th>
                    <th className="border px-4 py-2 text-center">Phân loại</th>
                    <th className="border px-4 py-2 text-center">Loại</th>
                    <th className="border px-4 py-2 text-center">Đơn vị</th>
                    <th className="border px-4 py-2 text-center">Tồn kho</th>
                    <th className="border px-4 py-2 text-center">Số lượng</th>
                    <th className="border px-4 py-2 text-center">Tình trạng</th>
                    <th className="border px-4 py-2 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item) => (
                    <tr key={item.inventoryId}>
                      <td className="border px-4 py-2">{item.name}</td>
                      <td className="border px-4 py-2 text-center">
                        <span className="text-sm">
                          {item.category === "LINEN" && "Vải lanh"}
                          {item.category === "TOILETRY" && "Đồ vệ sinh"}
                          {item.category === "MINIBAR" && "Minibar"}
                          {item.category === "CLEANING" && "Vệ sinh"}
                          {item.category === "OTHER" && "Khác"}
                        </span>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.inventoryType === "CONSUMABLE"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.inventoryType === "CONSUMABLE"
                            ? "Tiêu hao"
                            : "Luân chuyển"}
                        </span>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {item.unit}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        {item.availableQuantity}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.availableQuantity}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              item.inventoryId,
                              Number(e.target.value)
                            )
                          }
                          className="w-20 border px-2 py-1 rounded text-center"
                        />
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <select
                          value={item.condition || "GOOD"}
                          onChange={(e) =>
                            handleUpdateCondition(
                              item.inventoryId,
                              e.target.value
                            )
                          }
                          className={`px-2 py-1 rounded text-sm border ${
                            item.condition === "GOOD"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : item.condition === "USED"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : item.condition === "DIRTY"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : item.condition === "DAMAGED"
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-gray-100 text-gray-800 border-gray-300"
                          }`}
                        >
                          <option value="GOOD">Tốt</option>
                          <option value="USED">Đã sử dụng</option>
                          <option value="DIRTY">Bẩn</option>
                          <option value="DAMAGED">Hư hỏng</option>
                          <option value="LOST">Mất</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.inventoryId)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Nút submit */}
        <div className="flex gap-4 justify-end border-t pt-6">
          <button
            type="button"
            onClick={() => navigate("/inventory/receipt")}
            className="px-6 py-2 border rounded hover:bg-gray-100 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={formData.items.length === 0}
            className={`px-6 py-2 rounded transition ${
              formData.items.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Tạo phiếu
          </button>
        </div>
      </form>
    </div>
  );
}
