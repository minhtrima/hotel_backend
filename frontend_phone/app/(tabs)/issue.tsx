import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

import { useAuth } from '@/src/contexts/AuthContext';
import NetworkStatus from '@/src/components/NetworkStatus';
import { pickImage, takePhoto, uploadImageToCloudinary } from '@/src/services/imageService';
import { reportIssue, getRooms } from '@/src/services/issueService';

export default function IssueReportScreen() {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState('');
  const [rooms, setRooms] = useState([]);
  const [issueCategory, setIssueCategory] = useState('maintenance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const result = await getRooms();
      if (result.success) {
        const roomsList = Array.isArray(result.data.rooms) ? result.data.rooms : [];
        const filtered = roomsList.filter((r) => r.status !== 'occupied');
        setRooms(filtered);
      } else {
        Alert.alert('Lỗi', result.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách phòng');
    }
  };

  const showImageOptions = () => {
    if (uploadingImage) {
      Alert.alert('Thông báo', 'Đang upload ảnh, vui lòng đợi...');
      return;
    }

    Alert.alert(
      'Chọn hình ảnh',
      'Bạn muốn chọn hình ảnh từ đâu?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Thư viện', onPress: handlePickImage },
        { text: 'Chụp ảnh', onPress: handleTakePhoto },
      ]
    );
  };

  const handlePickImage = async () => {
    setUploadingImage(true);
    try {
      const imageResult = await pickImage();
      if (imageResult) {
        await uploadImage(imageResult.uri);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    setUploadingImage(true);
    try {
      const photoResult = await takePhoto();
      if (photoResult) {
        await uploadImage(photoResult.uri);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadImage = async (imageUri) => {
    try {
      const uploadResult = await uploadImageToCloudinary(imageUri);
      if (uploadResult.success) {
        setImages(prev => [...prev, {
          uri: imageUri,
          cloudinaryUrl: uploadResult.url,
          publicId: uploadResult.publicId,
        }]);
        Alert.alert('Thành công', 'Đã upload hình ảnh thành công!');
      } else {
        Alert.alert('Lỗi', uploadResult.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể upload hình ảnh');
    }
  };

  const removeImage = (index) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa hình ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => {
            setImages(prev => prev.filter((_, i) => i !== index));
          }
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedRoom) {
      Alert.alert('Lỗi', 'Vui lòng chọn phòng');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề sự cố');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả sự cố');
      return;
    }

    setLoading(true);
    try {
      const issueData = {
        roomId: selectedRoom,
        title: title.trim(),
        description: description.trim(),
        category: issueCategory,
        images: images.map(img => img.cloudinaryUrl),
        reportedBy: user?.staffId,
      };

      const result = await reportIssue(issueData);
      
      if (result.success) {
        Alert.alert(
          'Thành công',
          'Đã gửi báo cáo sự cố thành công!',
          [
            { 
              text: 'OK', 
              onPress: resetForm 
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRoom('');
    setTitle('');
    setDescription('');
    setImages([]);
    setIssueCategory('maintenance');
  };

  const getCategoryText = (category) => {
    switch (category) {
      case 'maintenance':
        return 'Bảo trì';
      case 'guest-complaint':
        return 'Khiếu nại khách hàng';
      case 'other':
        return 'Khác';
      default:
        return category;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatus />
      
      <View style={styles.header}>
        <Text style={styles.title}>Báo cáo sự cố</Text>
        <Text style={styles.subtitle}>
          Báo cáo sự cố trong quá trình làm việc
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Room Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Chọn phòng *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRoom}
              onValueChange={(itemValue) => setSelectedRoom(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="-- Chọn phòng --" value="" />
              {rooms.map((room) => (
                <Picker.Item 
                  key={room._id} 
                  label={`Phòng ${room.roomNumber} - ${room.floor}`} 
                  value={room._id} 
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Issue Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Loại sự cố *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={issueCategory}
              onValueChange={(itemValue) => setIssueCategory(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Bảo trì" value="maintenance" />
              <Picker.Item label="Khiếu nại khách hàng" value="guest-complaint" />
              <Picker.Item label="Khác" value="other" />
            </Picker>
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Tiêu đề sự cố *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập tiêu đề ngắn gọn về sự cố..."
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Mô tả chi tiết *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Mô tả chi tiết về sự cố, bao gồm thời gian phát hiện, mức độ nghiêm trọng..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.label}>Hình ảnh minh họa</Text>
          <Text style={styles.helpText}>
            Thêm hình ảnh để minh họa sự cố (tối đa 5 ảnh)
          </Text>
          
          {/* Image Grid */}
          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add Image Button */}
            {images.length < 5 && (
              <TouchableOpacity 
                style={styles.addImageButton} 
                onPress={showImageOptions}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#6b7280" />
                ) : (
                  <>
                    <Text style={styles.addImageIcon}>+</Text>
                    <Text style={styles.addImageText}>Thêm ảnh</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  picker: {
    height: 50,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageIcon: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  addImageText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});