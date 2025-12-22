import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getRooms } from "./issueService";

// Cấu hình URL cho các môi trường khác nhau
const getBaseURL = () => {
  // Cho production
  // return 'https://your-production-api.com/api';

  // Cho development
  if (Platform.OS === "android") {
    // Android emulator - sử dụng IP thực của máy tính
    return "http://10.189.13.82:3000/api";
    // Nếu test trên Android emulator và IP trên không hoạt động, thử:
    // return "http://10.0.2.2:3000/api";
  } else {
    // iOS simulator hoặc device thật
    return "http://10.189.13.82:3000/api";
    // Nếu test trên iOS simulator và IP trên không hoạt động, thử:
    // return "http://localhost:3000/api";
  }
};

const BASE_URL = getBaseURL();

// Tạo instance axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Tăng timeout lên 15 giây
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm logging để debug
console.log("API Base URL:", BASE_URL);

// Request interceptor để thêm token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("API Error:", error.message);
    console.log("API Error Details:", error.response?.data);
    console.log("API Error Config:", error.config?.baseURL + error.config?.url);

    if (error.code === "ECONNABORTED") {
      throw new Error("Kết nối quá chậm. Vui lòng thử lại!");
    }

    if (error.code === "NETWORK_ERROR" || !error.response) {
      console.log("Network error detected. Full error:", error);
      console.log("Trying to connect to:", error.config?.baseURL);
      throw new Error(
        `Không thể kết nối đến server tại ${error.config?.baseURL}. Vui lòng kiểm tra:\n1. Backend server đang chạy\n2. IP address đúng (${error.config?.baseURL})\n3. Kết nối mạng`
      );
    }

    if (error.response?.status === 401) {
      // Token expired hoặc không valid
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userInfo");
      // Có thể dispatch logout action ở đây
    }

    return Promise.reject(error);
  }
);

// Thêm method để gọi API tasks cho mobile
export const taskService = {
  // Lấy tasks theo staffId cho nhân viên housekeeping
  getTasksByStaff: async (staffId) => {
    try {
      const response = await api.get(`/tasks/staff/${staffId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks by staff:", error);
      throw error;
    }
  },

  // Cập nhật status của task
  updateTaskStatus: async (taskId, status, note = null) => {
    try {
      console.log(`Updating task status: ${taskId} to ${status}`);
      console.log(`API URL: ${BASE_URL}/tasks/${taskId}/status`);

      const data = { status };
      if (note) {
        data.note = note;
        console.log("Including note:", note);
      }

      const response = await api.patch(`/tasks/${taskId}/status`, data);
      console.log("Task status update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating task status:", error);
      console.error("Error details:", error.response?.data);
      console.error("Status code:", error.response?.status);
      console.error("URL:", error.config?.url);
      throw error;
    }
  },

  // Lấy task theo ID
  getTaskById: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching task:", error);
      throw error;
    }
  },
};

// Thêm room service cho DND functionality
export const roomService = {
  // Cập nhật trạng thái phòng (bao gồm DND)
  updateRoomStatus: async (roomId, statusData) => {
    try {
      const response = await api.put(`/room/${roomId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error("Error updating room status:", error);
      throw error;
    }
  },

  getRooms: async () => {
    try {
      const response = await api.get("/room");
      return response.data;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      throw error;
    }
  },

  // Lấy thông tin phòng
  getRoomById: async (roomId) => {
    try {
      const response = await api.get(`/room/${roomId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching room:", error);
      throw error;
    }
  },
};

export const API_URL = BASE_URL;
export default api;
