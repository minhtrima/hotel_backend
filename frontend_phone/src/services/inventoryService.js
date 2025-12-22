import api from "./api";

export const inventoryService = {
  // Lấy danh sách vật tư
  getInventoryItems: async () => {
    try {
      const response = await api.get("/inventories");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy danh sách vật tư"
      );
    }
  },

  // Cập nhật số lượng vật tư
  updateInventoryQuantity: async (itemId, quantity) => {
    try {
      const response = await api.put(`/inventories/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể cập nhật số lượng vật tư"
      );
    }
  },

  // Yêu cầu bổ sung vật tư
  requestInventoryRefill: async (itemId, requestedQuantity, note) => {
    try {
      // Tạo task yêu cầu bổ sung
      const response = await api.post("/tasks", {
        title: `Yêu cầu bổ sung vật tư`,
        description: `Cần bổ sung ${requestedQuantity} ${itemId}. ${
          note || ""
        }`,
        taskType: "refill",
        priority: "medium",
        assignedBy: null, // sẽ được set từ context
        assignedTo: null, // sẽ được assign cho manager
        status: "pending",
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể tạo yêu cầu bổ sung vật tư"
      );
    }
  },
};

export default inventoryService;
