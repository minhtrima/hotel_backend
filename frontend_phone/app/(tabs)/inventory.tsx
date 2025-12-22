import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import inventorySlipService from '@/src/services/inventorySlipService';
import { roomService } from '@/src/services/api';
import inventoryService from '@/src/services/inventoryService';
import taskService from '@/src/services/taskService';
import NetworkStatus from '@/src/components/NetworkStatus';

// Component Card hiển thị phiếu vật tư
const SlipCard = ({ slip, onPress }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'REFILL':
        return '#3b82f6'; // blue
      case 'CHECKOUT':
        return '#10b981'; // green
      case 'INSPECTION':
        return '#f59e0b'; // yellow
      case 'LOSS':
        return '#ef4444'; // red
      case 'DAMAGE':
        return '#f97316'; // orange
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <TouchableOpacity style={styles.slipCard} onPress={onPress}>
      <View style={styles.slipHeader}>
        <View>
          <Text style={styles.slipRoom}>
            Phòng: {slip.roomId?.roomNumber || 'N/A'}
          </Text>
          <Text style={styles.slipDate}>
            {new Date(slip.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: getTypeColor(slip.type) },
          ]}
        >
          <Text style={styles.typeBadgeText}>
            {inventorySlipService.getTypeLabel(slip.type)}
          </Text>
        </View>
      </View>

      <View style={styles.slipBody}>
        <Text style={styles.slipInfo}>
          Số lượng vật tư: {slip.items?.length || 0}
        </Text>
        {slip.taskId && (
          <Text style={styles.slipInfo} numberOfLines={1}>
            Công việc: {slip.taskId.title}
          </Text>
        )}
      </View>

      <View style={styles.slipFooter}>
        <Text style={styles.viewDetails}>Xem chi tiết →</Text>
      </View>
    </TouchableOpacity>
  );
};

// Modal hiển thị chi tiết phiếu
const SlipDetailModal = ({ visible, slip, onClose, onCancel }) => {
  if (!slip) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Chi tiết phiếu vật tư</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailBody}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Phòng:</Text>
              <Text style={styles.detailValue}>
                {slip.roomId?.roomNumber || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Loại phiếu:</Text>
              <Text style={styles.detailValue}>
                {inventorySlipService.getTypeLabel(slip.type)}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Nhân viên:</Text>
              <Text style={styles.detailValue}>
                {slip.staffId?.name || 'N/A'}
              </Text>
            </View>

            {slip.taskId && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Công việc:</Text>
                <Text style={styles.detailValue}>{slip.taskId.title}</Text>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Ngày tạo:</Text>
              <Text style={styles.detailValue}>
                {new Date(slip.createdAt).toLocaleString('vi-VN')}
              </Text>
            </View>

            {slip.note && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Ghi chú:</Text>
                <Text style={styles.detailValue}>{slip.note}</Text>
              </View>
            )}

            <View style={styles.itemsSection}>
              <Text style={styles.itemsTitle}>
                Danh sách vật tư ({slip.items?.length || 0})
              </Text>
              {slip.items?.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <Text style={styles.itemName}>
                    {item.inventoryId?.name || 'N/A'}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      {item.quantity} {item.inventoryId?.unit || ''}
                    </Text>
                    {item.condition && (
                      <Text
                        style={[
                          styles.itemCondition,
                          item.condition === 'DAMAGED' ||
                          item.condition === 'LOST'
                            ? styles.itemConditionBad
                            : styles.itemConditionGood,
                        ]}
                      >
                        {inventorySlipService.getConditionLabel(item.condition)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.detailFooter}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={onClose}
            >
              <Text style={styles.closeModalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Modal thêm phiếu vật tư mới
const CreateSlipModal = ({ visible, onClose, onSuccess }: any) => {
  const { user }: any = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    roomId: '',
    taskId: '',
    type: 'REFILL',
    items: [],
    note: '',
  });

  const [selectedInventory, setSelectedInventory] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');
  const [selectedCondition, setSelectedCondition] = useState('GOOD');
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      console.log('CreateSlipModal: Loading data...');
      setLoading(true);
      const staffId = user?.staffId?._id;
      console.log('CreateSlipModal: StaffId:', staffId);
      
      const [tasksData, inventoriesData,roomData] = await Promise.all([
        taskService.getMyTasks(staffId || ''),
        inventorySlipService.getInventories(),
        roomService.getRooms(),
      ]);
      
      console.log('Room loaded:', roomData);
      
      setTasks(tasksData || []);
      setInventories(inventoriesData || []);
        setRooms(roomData.rooms || []);
    } catch (error: any) {
      console.error('CreateSlipModal: Error loading data:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      console.log('CreateSlipModal: Loading finished');
    }
  };

  const handleAddItem = () => {
    if (!selectedInventory) {
      Alert.alert('Lỗi', 'Vui lòng chọn vật tư');
      return;
    }

    const quantity = parseInt(selectedQuantity);
    if (isNaN(quantity) || quantity < 1) {
      Alert.alert('Lỗi', 'Số lượng không hợp lệ');
      return;
    }

    const inventory = inventories.find((inv) => inv._id === selectedInventory);
    if (!inventory) {
      Alert.alert('Lỗi', 'Không tìm thấy vật tư');
      return;
    }

    if (quantity > inventory.quantity) {
      Alert.alert(
        'Lỗi',
        `Không đủ tồn kho. Còn lại: ${inventory.quantity} ${inventory.unit}`
      );
      return;
    }

    const exists = formData.items.find(
      (item) => item.inventoryId === selectedInventory
    );
    if (exists) {
      Alert.alert('Lỗi', 'Vật tư đã được thêm');
      return;
    }

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          inventoryId: selectedInventory,
          name: inventory.name,
          unit: inventory.unit,
          quantity: quantity,
          condition: selectedCondition,
          availableQuantity: inventory.quantity,
        },
      ],
    });

    setSelectedInventory('');
    setSelectedQuantity('1');
    setSelectedCondition('GOOD');
  };

  const handleRemoveItem = (inventoryId) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.inventoryId !== inventoryId),
    });
  };

  const handleSubmit = async () => {
    if (!formData.roomId) {
      Alert.alert('Lỗi', 'Vui lòng nhập số phòng');
      return;
    }

    if (formData.items.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng thêm ít nhất 1 vật tư');
      return;
    }

    const staffId = user?.staffId?._id;
    if (!staffId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    try {
      setLoading(true);
      await inventorySlipService.createSlip({
        roomId: formData.roomId || undefined,
        taskId: formData.taskId || undefined,
        staffId: staffId,
        type: formData.type,
        items: formData.items.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          condition: item.condition,
        })),
        note: formData.note,
      });

      Alert.alert('Thành công', 'Đã tạo phiếu vật tư');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('CreateSlipModal: Error creating slip:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo phiếu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      roomId: '',
      taskId: '',
      type: 'REFILL',
      items: [],
      note: '',
    });
    setSelectedInventory('');
    setSelectedQuantity('1');
    setSelectedCondition('GOOD');
  };

  const selectedTask = tasks.find((t) => t._id === formData.taskId);
  const selectedRoom = rooms.find((r) => r._id === formData.roomId);
  const selectedInv = inventories.find((i) => i._id === selectedInventory);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.createModal}>
          <View style={styles.createHeader}>
            <Text style={styles.createTitle}>Tạo phiếu vật tư</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createBody}>
            {/* Số phòng */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Số phòng *</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowRoomPicker(true)}
              >
                <Text
                  style={
                    formData.roomId ? styles.selectedText : styles.placeholderText
                  }
                >
                  {selectedRoom ? selectedRoom.roomNumber : '-- Chọn phòng --'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Công việc */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Công việc (tùy chọn)</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowTaskPicker(true)}
              >
                <Text
                  style={
                    formData.taskId ? styles.selectedText : styles.placeholderText
                  }
                >
                  {selectedTask ? selectedTask.title : '-- Chọn công việc --'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Loại phiếu */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Loại phiếu *</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setShowTypePicker(true)}
              >
                <Text style={styles.selectedText}>
                  {inventorySlipService.getTypeLabel(formData.type)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ghi chú */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.note}
                onChangeText={(text) =>
                  setFormData({ ...formData, note: text })
                }
                placeholder="Nhập ghi chú..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Thêm vật tư */}
            <View style={styles.addItemSection}>
              <Text style={styles.sectionTitle}>Thêm vật tư</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vật tư</Text>
                <TouchableOpacity
                  style={styles.formInput}
                  onPress={() => setShowInventoryPicker(true)}
                >
                  <Text
                    style={
                      selectedInventory
                        ? styles.selectedText
                        : styles.placeholderText
                    }
                  >
                    {selectedInv
                      ? `${selectedInv.name} - Tồn: ${selectedInv.quantity} ${selectedInv.unit}`
                      : '-- Chọn vật tư --'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inlineGroup}>
                <View style={styles.halfWidth}>
                  <Text style={styles.formLabel}>Số lượng</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedQuantity}
                    onChangeText={setSelectedQuantity}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.formLabel}>Tình trạng</Text>
                  <TouchableOpacity
                    style={styles.formInput}
                    onPress={() => setShowConditionPicker(true)}
                  >
                    <Text style={styles.selectedText}>
                      {inventorySlipService.getConditionLabel(
                        selectedCondition
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddItem}
              >
                <Text style={styles.addButtonText}>+ Thêm vật tư</Text>
              </TouchableOpacity>
            </View>

            {/* Danh sách vật tư đã chọn */}
            {formData.items.length > 0 && (
              <View style={styles.selectedItems}>
                <Text style={styles.sectionTitle}>
                  Vật tư đã chọn ({formData.items.length})
                </Text>
                {formData.items.map((item, index) => (
                  <View key={index} style={styles.selectedItem}>
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemName}>{item.name}</Text>
                      <Text style={styles.selectedItemDetail}>
                        {item.quantity} {item.unit} -{' '}
                        {inventorySlipService.getConditionLabel(item.condition)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.inventoryId)}
                    >
                      <Text style={styles.removeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.createFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Tạo phiếu</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Room Picker Modal */}
          <Modal
            visible={showRoomPicker}
            transparent={true}
            animationType="fade"
          >
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowRoomPicker(false)}
            >
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Chọn phòng</Text>
                <ScrollView style={styles.pickerList}>
                  {rooms.map((room) => (
                    <TouchableOpacity
                      key={room._id}
                      style={styles.pickerItem}
                      onPress={() => {
                        setFormData({ ...formData, roomId: room._id });
                        setShowRoomPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {room.roomNumber}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Task Picker Modal */}
          <Modal
            visible={showTaskPicker}
            transparent={true}
            animationType="fade"
          >
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowTaskPicker(false)}
            >
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Chọn công việc</Text>
                <ScrollView style={styles.pickerList}>
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setFormData({ ...formData, taskId: '' });
                      setShowTaskPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>-- Không liên kết --</Text>
                  </TouchableOpacity>
                  {tasks.map((task) => (
                    <TouchableOpacity
                      key={task._id}
                      style={styles.pickerItem}
                      onPress={() => {
                        setFormData({ ...formData, taskId: task._id });
                        setShowTaskPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{task.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Type Picker Modal */}
          <Modal
            visible={showTypePicker}
            transparent={true}
            animationType="fade"
          >
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowTypePicker(false)}
            >
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Chọn loại phiếu</Text>
                <ScrollView style={styles.pickerList}>
                  {['REFILL', 'CHECKOUT', 'INSPECTION', 'LOSS', 'DAMAGE', 'MINIBAR'].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.pickerItem}
                        onPress={() => {
                          setFormData({ ...formData, type });
                          setShowTypePicker(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>
                          {inventorySlipService.getTypeLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Inventory Picker Modal */}
          <Modal
            visible={showInventoryPicker}
            transparent={true}
            animationType="fade"
          >
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowInventoryPicker(false)}
            >
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Chọn vật tư</Text>
                <ScrollView style={styles.pickerList}>
                  {inventories
                    .filter(
                      (inv) =>
                        !formData.items.find(
                          (item) => item.inventoryId === inv._id
                        )
                    )
                    .filter((inv) => {
                      // Nếu type là MINIBAR, chỉ hiển thị category MINIBAR
                      if (formData.type === 'MINIBAR') {
                        return inv.category === 'MINIBAR';
                      }
                      // Nếu không phải MINIBAR, loại bỏ category MINIBAR
                      return inv.category !== 'MINIBAR';
                    })
                    .map((inv) => (
                      <TouchableOpacity
                        key={inv._id}
                        style={styles.pickerItem}
                        onPress={() => {
                          setSelectedInventory(inv._id);
                          setShowInventoryPicker(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>
                          {inv.name} - Tồn: {inv.quantity} {inv.unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Condition Picker Modal */}
          <Modal
            visible={showConditionPicker}
            transparent={true}
            animationType="fade"
          >
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowConditionPicker(false)}
            >
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Chọn tình trạng</Text>
                <ScrollView style={styles.pickerList}>
                  {['GOOD', 'DIRTY', 'DAMAGED', 'LOST'].map((condition) => (
                    <TouchableOpacity
                      key={condition}
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedCondition(condition);
                        setShowConditionPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {inventorySlipService.getConditionLabel(condition)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Main Screen
export default function InventoryScreen() {
  console.log('InventoryScreen rendering...');
  const { user } = useAuth();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    console.log('InventoryScreen mounted');
    console.log('User:', user);
    loadSlips();
  }, []);

  const loadSlips = async () => {
    try {
        setLoading(true);
        const staffId = user?.staffId?._id;
        
        const data = await inventorySlipService.getSlips({ staffId:staffId });
        
        setSlips(data || []);
    } catch (error) {
        console.error('Error loading slips:', error);
        console.error('Error stack:', error.stack);
        // Không hiển thị alert lỗi, chỉ log để debug
        setSlips([]);
    } finally {
        setLoading(false);
        console.log('loadSlips finished');
    }
    };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSlips();
    setRefreshing(false);
  }, []);

  const handleViewSlip = (slip) => {
    setSelectedSlip(slip);
    setShowDetailModal(true);
  };

  const handleCreateSuccess = () => {
    loadSlips();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NetworkStatus />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phiếu vật tư</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addButtonText}>+ Tạo phiếu</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {slips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có phiếu vật tư nào</Text>
              <Text style={styles.emptySubText}>
                Nhấn nút "Tạo phiếu" để thêm phiếu mới
              </Text>
            </View>
          ) : (
            slips.map((slip) => (
              <SlipCard
                key={slip._id}
                slip={slip}
                onPress={() => handleViewSlip(slip)}
              />
            ))
          )}
        </ScrollView>
      )}

      <CreateSlipModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <SlipDetailModal
        visible={showDetailModal}
        slip={selectedSlip}
        onClose={() => setShowDetailModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  slipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  slipRoom: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  slipDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  slipBody: {
    marginBottom: 12,
  },
  slipInfo: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  slipFooter: {
    alignItems: 'flex-end',
  },
  viewDetails: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  createModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  detailBody: {
    padding: 20,
  },
  createBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  itemsSection: {
    marginTop: 20,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemCondition: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemConditionGood: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  itemConditionBad: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  detailFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  createFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  closeModalButton: {
    backgroundColor: '#e5e7eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectedText: {
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  addItemSection: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  inlineGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  selectedItems: {
    marginTop: 16,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedItemDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
  removeButton: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
});
