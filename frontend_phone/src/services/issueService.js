import api from "./api";

export const reportIssue = async (issueData) => {
  try {
    console.log("Submitting issue report:", issueData);

    const response = await api.post("/tasks/report-issue", issueData);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } else {
      return {
        success: false,
        error: response.data.message || "Không thể gửi báo cáo sự cố",
      };
    }
  } catch (error) {
    console.error("Issue report error:", error);

    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message,
      };
    }

    return {
      success: false,
      error: "Có lỗi xảy ra khi gửi báo cáo sự cố",
    };
  }
};

export const getRooms = async () => {
  try {
    const response = await api.get("/room");

    if (response.data.success) {
      return {
        success: true,
        data: response.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || "Không thể lấy danh sách phòng",
      };
    }
  } catch (error) {
    console.error("Get rooms error:", error);
    return {
      success: false,
      error: "Có lỗi xảy ra khi lấy danh sách phòng",
    };
  }
};
