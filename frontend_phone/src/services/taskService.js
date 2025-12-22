import api from "./api";

export const taskService = {
  // Lấy danh sách task của nhân viên
  getMyTasks: async (staffId, status = null) => {
    try {
      const params = { assignedTo: staffId };
      if (status) params.status = status;

      const response = await api.get("/tasks", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy danh sách công việc"
      );
    }
  },

  // Cập nhật trạng thái task
  updateTaskStatus: async (taskId, status, note = "") => {
    try {
      const response = await api.put(`/tasks/${taskId}`, {
        status,
        note,
        ...(status === "completed" && { completedAt: new Date() }),
        ...(status === "in-progress" && { startTime: new Date() }),
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Không thể cập nhật trạng thái công việc"
      );
    }
  },

  // Lấy chi tiết task
  getTaskById: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể lấy thông tin công việc"
      );
    }
  },
};

export default taskService;
