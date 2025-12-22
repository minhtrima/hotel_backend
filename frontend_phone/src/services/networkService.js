import NetInfo from "@react-native-community/netinfo";
import { Alert } from "react-native";

class NetworkService {
  constructor() {
    this.isConnected = true;
    this.listeners = [];
    this.init();
  }

  init() {
    // Subscribe to network state updates
    NetInfo.addEventListener((state) => {
      console.log("Network state changed:", state);
      this.isConnected = state.isConnected;

      // Notify listeners
      this.listeners.forEach((listener) => listener(state));

      // Show alert if connection lost
      if (!state.isConnected) {
        Alert.alert(
          "Không có kết nối mạng",
          "Vui lòng kiểm tra kết nối internet của bạn",
          [{ text: "OK" }]
        );
      }
    });
  }

  // Get current network state
  async getCurrentState() {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected;
    return state;
  }

  // Check if connected
  getIsConnected() {
    return this.isConnected;
  }

  // Add listener for network state changes
  addListener(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Check if we can make network requests
  async canMakeRequests() {
    const state = await this.getCurrentState();
    return state.isConnected && state.isInternetReachable !== false;
  }

  // Show network error alert
  showNetworkError(customMessage) {
    const message =
      customMessage || "Vui lòng kiểm tra kết nối mạng và thử lại";
    Alert.alert("Lỗi kết nối", message, [
      { text: "Thử lại", style: "default" },
      { text: "Hủy", style: "cancel" },
    ]);
  }
}

export const networkService = new NetworkService();
export default networkService;
