import api from "./api";

export const housekeepingService = {
  // Lấy danh sách phòng được phân công
  getAssignedRooms: async (staffId) => {
    try {
      const response = await api.get(`/housekeeping/rooms/${staffId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy danh sách phòng"
      );
    }
  },

  // Cập nhật trạng thái housekeeping
  updateRoomStatus: async (roomId, statusData) => {
    try {
      const response = await api.patch(
        `/housekeeping/rooms/${roomId}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể cập nhật trạng thái phòng"
      );
    }
  },

  // Bắt đầu dọn phòng
  startCleaning: async (roomId, staffId) => {
    try {
      const response = await api.post(`/housekeeping/rooms/${roomId}/start`, {
        staffId,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể bắt đầu dọn phòng"
      );
    }
  },

  // Hoàn thành dọn phòng
  completeCleaning: async (roomId, staffId, note, issues) => {
    try {
      const response = await api.post(
        `/housekeeping/rooms/${roomId}/complete`,
        {
          staffId,
          note,
          issues,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể hoàn thành dọn phòng"
      );
    }
  },
};

export default housekeepingService;
