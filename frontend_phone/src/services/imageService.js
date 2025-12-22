import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { api } from "./api";

// Upload image through backend API instead of directly to Cloudinary
export const pickImage = async () => {
  try {
    // Request permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh để upload hình!");
      return null;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Lỗi", "Không thể chọn hình ảnh");
    return null;
  }
};

export const takePhoto = async () => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Lỗi", "Cần quyền truy cập camera để chụp ảnh!");
      return null;
    }

    // Take photo
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error("Error taking photo:", error);
    Alert.alert("Lỗi", "Không thể chụp ảnh");
    return null;
  }
};

export const uploadImageToCloudinary = async (imageUri) => {
  try {
    const formData = new FormData();

    // Create file object
    const filename = imageUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename || "");
    const type = match ? `image/${match[1]}` : "image";

    formData.append("image", {
      uri: imageUri,
      type: type,
      name: filename || "image.jpg",
    });

    const response = await api.post("/tasks/upload-issue-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success) {
      return {
        success: true,
        url: response.data.data.url,
        publicId: response.data.data.publicId,
      };
    } else {
      throw new Error(response.data.message || "Upload failed");
    }
  } catch (error) {
    console.error("Error uploading to backend:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Không thể upload hình ảnh",
    };
  }
};
