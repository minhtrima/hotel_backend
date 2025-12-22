import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import NetworkStatus from '@/src/components/NetworkStatus';
import ChangePasswordModal from '@/src/components/ChangePasswordModal';
import EditProfileModal from '@/src/components/EditProfileModal';
import ChangeAvatarModal from '@/src/components/ChangeAvatarModal';

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangeAvatarModal, setShowChangeAvatarModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ],
    );
  };

  const handleProfileUpdateSuccess = (updatedStaff) => {
    // Cập nhật thông tin user với staff mới
    setUser((prevUser) => ({
      ...prevUser,
      email: updatedStaff.email,
      staffId: {
        ...prevUser.staffId,
        ...updatedStaff,
      },
    }));
  };

  const handleAvatarUpdateSuccess = (newAvatar) => {
    // Cập nhật avatar trong user state
    setUser((prevUser) => ({
      ...prevUser,
      avatar: newAvatar,
      staffId: {
        ...prevUser.staffId,
        avatar: newAvatar,
      },
    }));
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NetworkStatus />
      
      <ScrollView style={styles.content}>
        {/* Avatar & Name Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            onPress={() => setShowChangeAvatarModal(true)}
            style={styles.avatarContainer}
          >
            {user?.staffId?.avatar ? (
              <Image
                source={{ uri: user.staffId.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Staff Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thông tin nhân viên</Text>
            <TouchableOpacity
              onPress={() => setShowEditProfileModal(true)}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={18} color="#007AFF" />
              <Text style={styles.editButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <InfoRow
              label="Họ tên"
              value={user?.staffId?.name}
            />
            <InfoRow
              label="Vị trí"
              value={user?.staffId?.position === 'manager' ? 'Quản lý' : 
                     user?.staffId?.position === 'staff' ? 'Nhân viên' : 
                     user?.staffId?.position}
            />
            <InfoRow
              label="Số điện thoại"
              value={user?.staffId?.phoneNumber}
            />
            <InfoRow
              label="Địa chỉ"
              value={user?.staffId?.address}
            />
            <InfoRow
              label="CMND/CCCD"
              value={user?.staffId?.identificationNumber}
            />
            <InfoRow
              label="Ngày sinh"
              value={user?.staffId?.dateOfBirth 
                ? new Date(user.staffId.dateOfBirth).toLocaleDateString('vi-VN')
                : 'N/A'}
            />
            <InfoRow
              label="Ngày vào làm"
              value={user?.staffId?.dateOfJoining 
                ? new Date(user.staffId.dateOfJoining).toLocaleDateString('vi-VN')
                : 'N/A'}
            />
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <View style={styles.card}>
            <InfoRow
              label="Email"
              value={user?.email}
            />
            <InfoRow
              label="Vai trò"
              value={user?.role === 'admin' ? 'Quản trị viên' : 
                     user?.role === 'staff' ? 'Nhân viên' : 
                     user?.role}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/cccd-scan')}
          >
            <Ionicons name="qr-code" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Quét CCCD</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowChangePasswordModal(true)}
          >
            <Ionicons name="lock-closed" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Đổi mật khẩu</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>HaiAuHotel Mobile App</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userEmail={user?.email}
      />

      <EditProfileModal
        visible={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        staffData={user?.staffId}
        onSuccess={handleProfileUpdateSuccess}
      />

      <ChangeAvatarModal
        visible={showChangeAvatarModal}
        onClose={() => setShowChangeAvatarModal(false)}
        staffId={user?.staffId?._id}
        currentAvatar={user?.staffId?.avatar}
        onSuccess={handleAvatarUpdateSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
