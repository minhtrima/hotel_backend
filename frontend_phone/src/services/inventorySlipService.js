import api from "./api";
import debugService from "./debugService";

const inventorySlipService = {
  /**
   * Lấy danh sách phiếu vật tư
   * @param {Object} filters - {roomId, taskId, staffId, type}
   * @returns {Promise<Array>}
   */
  async getSlips(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.roomId) params.append("roomId", filters.roomId);
      if (filters.taskId) params.append("taskId", filters.taskId);
      if (filters.staffId) params.append("staffId", filters.staffId);
      if (filters.type) params.append("type", filters.type);

      const response = await api.get(`/inventory-slips?${params.toString()}`);

      // Sửa lại dòng này
      return response.data.data || response.data || [];
    } catch (error) {
      debugService.error("Error fetching inventory slips", error);
      console.error("Full error:", error);
      console.error("Error response exists?", !!error.response);

      // SỬA QUAN TRỌNG: Kiểm tra error.response trước khi truy cập
      let errorMessage = "Không thể tải danh sách phiếu vật tư";

      if (error.response) {
        // Có response từ server
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request đã được gửi nhưng không nhận được response
        errorMessage =
          "Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối.";
      } else {
        // Lỗi khi thiết lập request
        errorMessage = error.message || "Lỗi kết nối đến server";
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Lấy chi tiết phiếu vật tư
   * @param {string} slipId
   * @returns {Promise<Object>}
   */
  async getSlipById(slipId) {
    try {
      debugService.log("Fetching slip detail", slipId);

      const response = await api.get(`/inventory-slips?_id=${slipId}`);
      debugService.log("Slip detail fetched", response.data);

      return response.data.data?.[0] || null;
    } catch (error) {
      debugService.error("Error fetching slip detail", error);
      console.error("Full error:", error);
      console.error("Error response exists?", !!error.response);

      let errorMessage = "Không thể tải chi tiết phiếu";

      if (error.response) {
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage =
          "Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối.";
      } else {
        errorMessage = error.message || "Lỗi kết nối đến server";
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Tạo phiếu vật tư mới
   * @param {Object} slipData - {roomId, taskId, staffId, type, items, note}
   * @returns {Promise<Object>}
   */
  async createSlip(slipData) {
    try {
      const response = await api.post("/inventory-slips", slipData);
      debugService.log("Inventory slip created", response.data);
      console.log("Create response:", response);

      return response.data;
    } catch (error) {
      debugService.error("Error creating inventory slip", error);
      console.error("Full error:", error);
      console.error("Error response exists?", !!error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);

      let errorMessage = "Không thể tạo phiếu vật tư";

      if (error.response) {
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage =
          "Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối.";
      } else {
        errorMessage = error.message || "Lỗi kết nối đến server";
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Hủy phiếu vật tư
   * @param {string} slipId
   * @returns {Promise<Object>}
   */
  async cancelSlip(slipId) {
    try {
      debugService.log("Cancelling inventory slip", slipId);

      const response = await api.delete(`/inventory-slips/${slipId}`);
      debugService.log("Inventory slip cancelled", response.data);

      return response.data;
    } catch (error) {
      debugService.error("Error cancelling inventory slip", error);
      console.error("Full error:", error);
      console.error("Error response exists?", !!error.response);

      let errorMessage = "Không thể hủy phiếu vật tư";

      if (error.response) {
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage =
          "Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối.";
      } else {
        errorMessage = error.message || "Lỗi kết nối đến server";
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Lấy danh sách vật tư (inventories)
   * @returns {Promise<Array>}
   */
  async getInventories() {
    try {
      const response = await api.get("/inventories");

      // Backend trả về mảng trực tiếp, không có wrapper object
      const inventories = response.data ?? [];

      return inventories.filter((inv) => inv.isActive);
    } catch (error) {
      debugService.error("Error fetching inventories", error);
      console.error("Full error:", error);
      console.error("Error response:", error.response);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể lấy danh sách vật tư"
      );
    }
  },

  /**
   * Format slip type cho hiển thị
   */
  getTypeLabel(type) {
    const types = {
      REFILL: "Bổ sung",
      CHECKOUT: "Trả phòng",
      INSPECTION: "Kiểm tra",
      LOSS: "Mất mát",
      DAMAGE: "Hư hỏng",
    };
    return types[type] || type;
  },

  /**
   * Format condition cho hiển thị
   */
  getConditionLabel(condition) {
    const conditions = {
      GOOD: "Tốt",
      DIRTY: "Bẩn",
      DAMAGED: "Hư hỏng",
      LOST: "Mất",
    };
    return conditions[condition] || condition;
  },

  /**
   * Format category cho hiển thị
   */
  getCategoryLabel(category) {
    const categories = {
      LINEN: "Vải lanh",
      TOILETRY: "Đồ vệ sinh",
      CLEANING: "Vệ sinh",
      OTHER: "Khác",
    };
    return categories[category] || category;
  },

  /**
   * Format inventory type cho hiển thị
   */
  getInventoryTypeLabel(type) {
    const types = {
      CONSUMABLE: "Tiêu hao",
      REUSABLE: "Luân chuyển",
    };
    return types[type] || type;
  },
};

export default inventorySlipService;
