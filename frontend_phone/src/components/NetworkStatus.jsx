import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { networkService } from "../services/networkService";

const NetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [networkType, setNetworkType] = useState("");

  useEffect(() => {
    // Get initial network state
    networkService.getCurrentState().then((state) => {
      setIsConnected(state.isConnected);
      setNetworkType(state.type);
    });

    // Subscribe to network changes
    const unsubscribe = networkService.addListener((state) => {
      setIsConnected(state.isConnected);
      setNetworkType(state.type);
    });

    return unsubscribe;
  }, []);

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚠️ Không có kết nối mạng</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f59e0b",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 16,
  },
  text: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
});

export default NetworkStatus;
