import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { staffService } from "@/src/services/staffService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChangeAvatarModal({
  visible,
  onClose,
  staffId,
  currentAvatar,
  onSuccess,
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh để thay đổi ảnh đại diện"
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Ứng dụng cần quyền truy cập camera để chụp ảnh"
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Lỗi", "Không thể chụp ảnh. Vui lòng thử lại.");
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert("Lỗi", "Vui lòng chọn ảnh trước khi tải lên");
      return;
    }

    try {
      setLoading(true);

      // Gửi URI của ảnh, staffService sẽ xử lý convert sang base64
      const response = await staffService.changeAvatar(staffId, selectedImage.uri);

      if (response.success) {
        // Cập nhật avatar trong AsyncStorage
        const userInfo = await AsyncStorage.getItem("userInfo");
        if (userInfo) {
          const user = JSON.parse(userInfo);
          user.avatar = response.avatar;
          if (user.staffId) {
            user.staffId.avatar = response.avatar;
          }
          await AsyncStorage.setItem("userInfo", JSON.stringify(user));
        }

        Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công", [
          {
            text: "OK",
            onPress: () => {
              if (onSuccess) {
                onSuccess(response.avatar);
              }
              setSelectedImage(null);
              onClose();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  const showImageOptions = () => {
    Alert.alert(
      "Chọn ảnh",
      "Chọn nguồn ảnh",
      [
        {
          text: "Chụp ảnh",
          onPress: takePhoto,
        },
        {
          text: "Chọn từ thư viện",
          onPress: pickImage,
        },
        {
          text: "Hủy",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thay đổi ảnh đại diện</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          <View style={styles.imageContainer}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.image} />
            ) : currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
          </View>

          {/* Select Image Button */}
          <TouchableOpacity
            style={styles.selectButton}
            onPress={showImageOptions}
            disabled={loading}
          >
            <Ionicons name="images" size={20} color="#007AFF" />
            <Text style={styles.selectButtonText}>
              {selectedImage ? "Chọn ảnh khác" : "Chọn ảnh"}
            </Text>
          </TouchableOpacity>

          {/* Upload Button */}
          {selectedImage && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUpload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>Tải lên</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ddd",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  selectButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
});
