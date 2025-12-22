import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { networkService } from "./networkService";

export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    try {
      console.log("Attempting login with email:", email);

      // Kiểm tra kết nối mạng trước
      const canMakeRequest = await networkService.canMakeRequests();
      if (!canMakeRequest) {
        throw new Error(
          "Không có kết nối mạng. Vui lòng kiểm tra kết nối internet!"
        );
      }

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("Login response:", response.data);

      if (response.data.success) {
        const { user } = response.data;

        // Lưu thông tin user vào AsyncStorage
        await AsyncStorage.setItem("userInfo", JSON.stringify(user));

        // Tạo token giả (vì backend sử dụng cookie, có thể tạo token tại đây)
        const token = `token_${user.id}_${Date.now()}`;
        await AsyncStorage.setItem("userToken", token);

        return {
          success: true,
          user,
          token,
        };
      }

      throw new Error(response.data.message || "Đăng nhập thất bại");
    } catch (error) {
      console.error("Login error:", error);

      // Xử lý các loại lỗi khác nhau
      if (error.code === "ECONNABORTED") {
        throw new Error("Kết nối quá chậm. Vui lòng thử lại!");
      }

      if (error.code === "NETWORK_ERROR" || !error.response) {
        throw new Error(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại!"
        );
      }

      if (error.response?.status === 500) {
        throw new Error("Lỗi server. Vui lòng thử lại sau!");
      }

      if (error.response?.status === 404) {
        throw new Error(
          "Không tìm thấy endpoint đăng nhập. Vui lòng liên hệ hỗ trợ!"
        );
      }

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi đăng nhập"
      );
    }
  },

  // Đăng xuất
  logout: async () => {
    try {
      await api.post("/auth/logout");

      // Xóa thông tin lưu trữ local
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userInfo");

      return { success: true };
    } catch (_error) {
      // Vẫn xóa thông tin local dù API lỗi
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userInfo");

      return { success: true };
    }
  },

  // Kiểm tra token còn hạn không
  checkAuthStatus: async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userInfo = await AsyncStorage.getItem("userInfo");

      if (!token || !userInfo) {
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: true,
        user: JSON.parse(userInfo),
        token,
      };
    } catch (_error) {
      return { isAuthenticated: false };
    }
  },

  // Đổi mật khẩu
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await api.post("/auth/change-password", {
        oldPassword,
        newPassword,
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu"
      );
    }
  },

  // Lấy thông tin user từ storage
  getCurrentUser: async () => {
    try {
      const userInfo = await AsyncStorage.getItem("userInfo");
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (_error) {
      return null;
    }
  },
};
