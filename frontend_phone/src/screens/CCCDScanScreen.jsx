import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_URL } from "../services/api";

export default function CCCDScanScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [manualEntry, setManualEntry] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanning) return;
    setScanning(true);

    try {
      // Parse QR code from web
      const qrData = JSON.parse(data);

      if (qrData.action === "scan-cccd" && qrData.sessionId) {
        setSessionId(qrData.sessionId);
        // Show manual entry or camera for CCCD scan
        Alert.alert("Đã quét mã phiên", "Bây giờ hãy quét mã QR trên CCCD", [
          {
            text: "Nhập thủ công",
            onPress: () => setManualEntry(true),
          },
          {
            text: "Quét CCCD",
            onPress: () => {
              setScanning(false);
              // Continue scanning for CCCD
            },
          },
        ]);
      } else {
        // This might be CCCD QR code
        if (sessionId) {
          await submitCCCDData(data);
        } else {
          Alert.alert("Lỗi", "Vui lòng quét mã QR phiên trước");
          setScanning(false);
        }
      }
    } catch (error) {
      // Not a valid session QR, might be CCCD QR
      if (sessionId) {
        await submitCCCDData(data);
      } else {
        Alert.alert("Lỗi", "Mã QR không hợp lệ");
        setScanning(false);
      }
    }
  };

  const submitCCCDData = async (qrData) => {
    try {
      console.log(
        "Submitting CCCD data to:",
        `${API_URL}/cccd-scan/submit-data`
      );
      console.log("Session ID:", sessionId);
      console.log("QR Data:", qrData);

      const parsedData = parseCCCDQR(qrData);
      console.log("Parsed CCCD data:", parsedData);

      const response = await fetch(`${API_URL}/cccd-scan/submit-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          cccdData: parsedData,
        }),
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);

      if (result.success) {
        Alert.alert("Thành công", "Đã gửi thông tin CCCD", [
          {
            text: "OK",
            onPress: () => {
              setSessionId("");
              setScanning(false);
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert("Lỗi", result.message || "Không thể gửi dữ liệu");
        setScanning(false);
      }
    } catch (error) {
      console.error("Error submitting CCCD data:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      let errorMessage = "Không thể kết nối đến server";
      if (error.message === "Network request failed") {
        errorMessage = `Không thể kết nối đến server tại ${API_URL}\n\nVui lòng kiểm tra:\n- Server đang chạy\n- IP address đúng\n- Cùng mạng WiFi`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Lỗi kết nối", errorMessage);
      setScanning(false);
    }
  };

  const parseCCCDQR = (qrData) => {
    try {
      // CCCD QR format: "ID|LocationCode|FullName|DDMMYYYY|Gender|Address|IssueDate"
      const parts = qrData.split("|");

      if (parts.length < 7) {
        throw new Error("Invalid CCCD QR format");
      }

      const [
        identificationNumber,
        locationCode,
        fullName,
        dateOfBirth,
        gender,
        address,
        issueDate,
      ] = parts;

      // Parse full name
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[nameParts.length - 1];
      const lastName = nameParts.slice(0, -1).join(" ");

      // Convert date format from DDMMYYYY to YYYY-MM-DD
      let formattedDOB = "";
      if (dateOfBirth && dateOfBirth.length === 8) {
        const day = dateOfBirth.slice(0, 2);
        const month = dateOfBirth.slice(2, 4);
        const year = dateOfBirth.slice(4, 8);
        formattedDOB = `${year}-${month}-${day}`;
      }

      const honorific = gender.toLowerCase().includes("nam") ? "Ông" : "Bà";

      return {
        identificationNumber: identificationNumber.trim(),
        firstName,
        lastName,
        dateOfBirth: formattedDOB,
        honorific,
        gender: gender.toLowerCase().includes("nam") ? "male" : "female",
        identification: "national_id",
        nationality: "Việt Nam",
      };
    } catch (error) {
      console.error("Error parsing CCCD QR:", error);
      throw error;
    }
  };

  const handleManualSubmit = async () => {
    // For demo purposes, you can add manual form here
    Alert.alert("Thông báo", "Chức năng nhập thủ công đang được phát triển");
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Cần quyền truy cập camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.buttonText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (manualEntry) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Nhập thông tin CCCD</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.infoText}>
            Tính năng nhập thủ công đang được phát triển
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setManualEntry(false)}
          >
            <Text style={styles.buttonText}>Quay lại quét</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titleWhite}>Quét CCCD</Text>
        <View style={{ width: 24 }} />
      </View>

      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.instructionContainer}>
            {!sessionId ? (
              <>
                <Text style={styles.instructionTitle}>Bước 1</Text>
                <Text style={styles.instruction}>
                  Quét mã QR phiên từ màn hình máy tính
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.instructionTitle}>Bước 2</Text>
                <Text style={styles.instruction}>Quét mã QR trên CCCD</Text>
                <Text style={styles.sessionInfo}>
                  Phiên: {sessionId.slice(0, 8)}...
                </Text>
              </>
            )}
          </View>
        </View>
      </CameraView>

      {scanning && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang xử lý...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  titleWhite: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#fff",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionContainer: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  instruction: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  sessionInfo: {
    fontSize: 12,
    color: "#a0a0a0",
    marginTop: 8,
    fontFamily: "monospace",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
});
