import api from "./api";
import * as ImageManipulator from 'expo-image-manipulator';

export const staffService = {
  // Cập nhật thông tin nhân viên
  updateStaffInfo: async (staffId, data) => {
    try {
      const response = await api.put(`/staff/${staffId}`, data);
      return response.data;
    } catch (error) {
      console.error("Update staff info error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi cập nhật thông tin"
      );
    }
  },

  // Đổi mật khẩu
  changePassword: async (email, currentPassword, newPassword) => {
    try {
      const response = await api.post("/auth/change-password", {
        email,
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Change password error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi đổi mật khẩu"
      );
    }
  },

  // Đổi avatar - Gửi base64 thay vì FormData
  changeAvatar: async (staffId, imageUri) => {
    try {
      if (!imageUri) {
        throw new Error("Không có dữ liệu ảnh");
      }

      // Đọc file và convert sang base64
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // Resize để giảm kích thước
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) {
        throw new Error("Không thể chuyển đổi ảnh sang base64");
      }

      // Thêm prefix data URL nếu chưa có
      const imageBase64 = manipResult.base64.startsWith('data:')
        ? manipResult.base64
        : `data:image/jpeg;base64,${manipResult.base64}`;

      // Gửi request với JSON body
      const response = await api.put(`/staff/${staffId}/avatar`, {
        imageBase64,
      });

      return response.data;
    } catch (error) {
      console.error("Change avatar error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi thay đổi ảnh đại diện"
      );
    }
  },

  // Lấy thông tin nhân viên theo ID
  getStaffById: async (staffId) => {
    try {
      const response = await api.get(`/staff/${staffId}`);
      return response.data;
    } catch (error) {
      console.error("Get staff by ID error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi lấy thông tin nhân viên"
      );
    }
  },
};
 