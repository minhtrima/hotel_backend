import api from "./api";

export const testConnection = async () => {
  try {
    console.log("Testing connection to backend...");

    // Test a simple endpoint first
    const response = await api.get("/auth/findAll");
    console.log("Connection test successful:", response.status);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Connection test failed:", error);
    return {
      success: false,
      error: error.message,
      details: {
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      },
    };
  }
};

// Test function for manual debugging
export const debugNetworkIssue = async () => {
  console.log("=== Network Debug Information ===");

  try {
    // Test connection
    const result = await testConnection();
    console.log("Connection test result:", result);

    // Try to reach the auth endpoint specifically
    const loginTestResponse = await api.post("/auth/login", {
      email: "test@example.com",
      password: "wrongpassword",
    });

    console.log(
      "Login endpoint reachable, response:",
      loginTestResponse.status
    );
  } catch (error) {
    console.log("Login endpoint error (expected):", {
      code: error.code,
      message: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
    });
  }

  console.log("=== End Network Debug ===");
};
