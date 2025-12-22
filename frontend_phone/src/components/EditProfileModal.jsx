import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { staffService } from "@/src/services/staffService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditProfileModal({
  visible,
  onClose,
  staffData,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    address: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staffData) {
      setFormData({
        phoneNumber: staffData.phoneNumber || "",
        address: staffData.address || "",
        email: staffData.email || "",
      });
    }
  }, [staffData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.phoneNumber || formData.phoneNumber.trim() === "") {
      Alert.alert("Lỗi", "Số điện thoại không được để trống");
      return false;
    }

    if (formData.phoneNumber.length < 10) {
      Alert.alert("Lỗi", "Số điện thoại phải có ít nhất 10 số");
      return false;
    }

    if (!formData.address || formData.address.trim() === "") {
      Alert.alert("Lỗi", "Địa chỉ không được để trống");
      return false;
    }

    if (!formData.email || formData.email.trim() === "") {
      Alert.alert("Lỗi", "Email không được để trống");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Cập nhật thông tin staff
      const updateData = {
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        email: formData.email,
        // Giữ nguyên các thông tin khác
        name: staffData.name,
        identificationNumber: staffData.identificationNumber,
        dateOfBirth: staffData.dateOfBirth,
        position: staffData.position,
        shift: staffData.shift,
        salary: staffData.salary,
      };

      const response = await staffService.updateStaffInfo(
        staffData._id,
        updateData
      );

      if (response.success) {
        // Cập nhật lại user info trong AsyncStorage
        const userInfo = await AsyncStorage.getItem("userInfo");
        if (userInfo) {
          const user = JSON.parse(userInfo);
          user.email = formData.email;
          if (user.staffId) {
            user.staffId = {
              ...user.staffId,
              ...response.staff,
            };
          }
          await AsyncStorage.setItem("userInfo", JSON.stringify(user));
        }

        Alert.alert("Thành công", "Cập nhật thông tin thành công", [
          {
            text: "OK",
            onPress: () => {
              if (onSuccess) {
                onSuccess(response.staff);
              }
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
    // Reset form data to original values
    if (staffData) {
      setFormData({
        phoneNumber: staffData.phoneNumber || "",
        address: staffData.address || "",
        email: staffData.email || "",
      });
    }
    onClose();
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
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.form}>
            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Số điện thoại <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.phoneNumber}
                onChangeText={(value) =>
                  handleInputChange("phoneNumber", value)
                }
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                placeholder="Nhập email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Địa chỉ <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => handleInputChange("address", value)}
                placeholder="Nhập địa chỉ"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
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
    maxWidth: 500,
    maxHeight: "80%",
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
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#ff0000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#007AFF",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
