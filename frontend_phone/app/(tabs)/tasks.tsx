import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHousekeeping } from '@/src/contexts/HousekeepingContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { KeyboardAvoidingView, Platform } from 'react-native';
import NetworkStatus from '@/src/components/NetworkStatus';

const TaskCard = ({ task, onPress, onStatusChange, onCompleteTask }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // yellow
      case 'in-progress':
        return '#3b82f6'; // blue
      case 'completed':
        return '#10b981'; // green
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'in-progress':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return priority;
    }
  };

  return (
    <TouchableOpacity style={styles.taskCard} onPress={() => onPress(task)}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
          <Text style={styles.priorityText}>{getPriorityText(task.priority)}</Text>
        </View>
      </View>

      <Text style={styles.taskDescription}>{task.description}</Text>

      <View style={styles.taskInfo}>
        <Text style={styles.taskRoom}>
          Phòng: {task.roomId?.roomNumber || 'N/A'}
        </Text>
        <Text style={styles.taskType}>
          Loại: {task.taskType === 'cleaning' ? 'Dọn dẹp' : 
                 task.taskType === 'laundry' ? 'Giặt ủi' :
                 task.taskType === 'refill' ? 'Bổ sung' :
                 task.taskType === 'inspection' ? 'Kiểm tra' :
                 task.taskType}
        </Text>
      </View>

      <View style={styles.taskFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
        </View>
        <Text style={styles.taskDate}>
          {task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : ''}
        </Text>
      </View>

      {task.note && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>Ghi chú:</Text>
          <Text style={styles.noteText}>{task.note}</Text>
        </View>
      )}
      
      {/* Action buttons removed - actions now available inside modal */}
    </TouchableOpacity>
  );
};

export default function TasksScreen() {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in-progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'in-progress':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };
  const { 
    tasks, 
    isLoading, 
    error, 
    loadMyTasks,
    updateTaskStatus,
    updateRoomStatus,
    clearError 
  } = useHousekeeping();
  
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (user?.staffId) {
      loadMyTasks(selectedFilter === 'all' ? null : selectedFilter);
    }
  }, [user?.staffId, selectedFilter, loadMyTasks]);

  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyTasks(selectedFilter === 'all' ? null : selectedFilter);
    setRefreshing(false);
  };

  // Test function for debugging
  const testCompleteFunction = () => {
    console.log('Test complete function called');
    Alert.alert('Test', 'Complete function is working!');
  };

  const handleTaskPress = (task) => {
    // Open modal for any task status; footer will show actions depending on status
    console.log('Opening modal for task:', task._id);
    setSelectedTask(task);
    setNoteInput(task.note || '');
    setModalVisible(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      console.log('Attempting to update task:', taskId, 'to status:', newStatus);
      
      const result = await updateTaskStatus(taskId, newStatus);
      if (result.success) {
        Alert.alert(
          'Thành công',
          `Đã cập nhật trạng thái công việc thành: ${
            newStatus === 'in-progress' ? 'Đang thực hiện' :
            newStatus === 'completed' ? 'Hoàn thành' :
            newStatus
          }`
        );
        // Reload tasks to show updated status
        loadMyTasks(selectedFilter === 'all' ? null : selectedFilter);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Task update error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleSetDND = async (task) => {
    try {
      // First set room DND
      const roomResult = await updateRoomStatus(task.roomId._id, { doNotDisturb: true });
      if (roomResult.success) {
        // Then cancel the task
        const taskResult = await updateTaskStatus(task._id, 'cancelled');
        if (taskResult.success) {
          Alert.alert(
            'Thành công',
            `Đã đặt phòng ${task.roomId?.roomNumber} vào trạng thái DND và hủy công việc.`
          );
          // Reload tasks
          loadMyTasks(selectedFilter === 'all' ? null : selectedFilter);
        } else {
          Alert.alert('Lỗi', 'Không thể hủy công việc');
        }
      } else {
        Alert.alert('Lỗi', 'Không thể đặt trạng thái DND cho phòng');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đặt DND');
    }
  };

  const handleCompleteFromModal = async () => {
    if (!selectedTask) return;
    
    try {
      console.log('Completing task from modal:', selectedTask._id, 'with note:', noteInput);
      const result = await updateTaskStatus(selectedTask._id, 'completed', noteInput);
      console.log('Task completion result:', result);
      
      if (result && result.success) {
        Alert.alert('Thành công', 'Đã hoàn thành công việc!');
        setModalVisible(false);
        setSelectedTask(null);
        setNoteInput('');
        await loadMyTasks(selectedFilter === 'all' ? null : selectedFilter);
      } else {
        console.error('Task completion failed:', result);
        Alert.alert('Lỗi', 'Không thể hoàn thành công việc');
      }
    } catch (error) {
      console.error('Error in task completion:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra: ' + error.message);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
    setNoteInput('');
  };

  const handleCompleteTask = (taskId) => {
    console.log('handleCompleteTask called with taskId:', taskId);
    
    // Simple direct completion for testing
    Alert.alert(
      'Hoàn thành công việc',
      'Bạn có muốn hoàn thành công việc này không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Hoàn thành',
          onPress: async () => {
            try {
              console.log('Starting task completion process...');
              const result = await updateTaskStatus(taskId, 'completed');
              console.log('Task completion result:', result);
              
              if (result && result.success) {
                Alert.alert('Thành công', 'Đã hoàn thành công việc!');
                await loadMyTasks(selectedFilter === 'all' ? null : selectedFilter);
              } else {
                console.error('Task completion failed:', result);
                Alert.alert('Lỗi', 'Không thể hoàn thành công việc');
              }
            } catch (error) {
              console.error('Error in task completion:', error);
              Alert.alert('Lỗi', 'Có lỗi xảy ra: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const getFilteredTasks = () => {
    if (selectedFilter === 'all') return tasks;
    return tasks.filter(task => task.status === selectedFilter);
  };

  const filteredTasks = getFilteredTasks();

  const filterButtons = [
    { key: 'all', label: 'Tất cả', count: tasks.length },
    { key: 'pending', label: 'Chờ xử lý', count: tasks.filter(t => t.status === 'pending').length },
    { key: 'in-progress', label: 'Đang làm', count: tasks.filter(t => t.status === 'in-progress').length },
    { key: 'completed', label: 'Hoàn thành', count: tasks.filter(t => t.status === 'completed').length }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatus />

      <View style={styles.header}>
      <Text style={styles.title}>Công việc của tôi</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Xin chào, {user?.name || 'Nhân viên'}!</Text>
        <Text style={styles.infoTextRight}>
          {new Date().toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </View>


      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {filterButtons.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tasks List */}
        <View style={styles.tasksList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Không có công việc nào
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                <Text style={styles.refreshButtonText}>Làm mới</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onPress={handleTaskPress}
                onStatusChange={handleStatusChange}
                onCompleteTask={handleCompleteTask}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Task Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >

        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTask && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}
                >
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Mô tả:</Text>
                    <Text style={styles.modalText}>{selectedTask.description}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Phòng:</Text>
                    <Text style={styles.modalText}>{selectedTask.roomId?.roomNumber || 'N/A'}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Loại công việc:</Text>
                    <Text style={styles.modalText}>
                      {selectedTask.taskType === 'cleaning' ? 'Dọn dẹp' : 
                       selectedTask.taskType === 'laundry' ? 'Giặt ũi' :
                       selectedTask.taskType === 'refill' ? 'Bổ sung' :
                       selectedTask.taskType === 'inspection' ? 'Kiểm tra' :
                       selectedTask.taskType}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Trạng thái:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTask?.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedTask?.status)}</Text>
                    </View>
                  </View>

                    {selectedTask?.status === 'in-progress' && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Ghi chú hoàn thành:</Text>
                        <TextInput
                          style={styles.noteInput}
                          placeholder="Nhập ghi chú cho công việc..."
                          placeholderTextColor="#9ca3af"
                          multiline={true}
                          numberOfLines={4}
                          value={noteInput}
                          onChangeText={(text) => {
                            console.log('Note input changed:', text);
                            setNoteInput(text);
                          }}
                          textAlignVertical="top"
                          editable={true}
                          scrollEnabled={true}
                        />
                        <Text style={styles.debugText}>Current note: "{noteInput}"</Text>
                        <Text style={styles.debugText}>Input visible: {modalVisible ? 'YES' : 'NO'}</Text>
                      </View>
                    )}
                </ScrollView>

     

<View style={styles.modalFooter}>
  {selectedTask?.status === 'in-progress' ? (
    <>
      <TouchableOpacity 
        style={[styles.modalCancelButton, { flex: 1 }]}
        onPress={closeModal}
      >
        <Text style={styles.modalCancelButtonText}>Hủy</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.modalCompleteButton, { flex: 2, marginLeft: 8 }]}
        onPress={handleCompleteFromModal}
      >
        <Text style={styles.modalCompleteButtonText}>Kết thúc công việc</Text>
      </TouchableOpacity>
    </>
  ) : selectedTask?.status === 'pending' ? (
    <>
      <TouchableOpacity 
        style={[styles.modalCancelButton, { flex: 1 }]}
        onPress={closeModal}
      >
        <Text style={styles.modalCancelButtonText}>Hủy</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.modalCompleteButton, { flex: 1, marginHorizontal: 4, backgroundColor: '#dc2626' }]}
        onPress={async () => {
          await handleSetDND(selectedTask);
          closeModal();
        }}
      >
        <Text style={styles.modalCompleteButtonText}>DND</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.modalCompleteButton, { flex: 1, backgroundColor: '#2563eb', marginLeft: 4 }]}
        onPress={async () => {
          await handleStatusChange(selectedTask?._id, 'in-progress');
          closeModal();
        }}
      >
        <Text style={styles.modalCompleteButtonText}>Bắt đầu</Text>
      </TouchableOpacity>
    </>
  ) : (
    <TouchableOpacity 
      style={[styles.modalCompleteButton, { flex: 1 }]}
      onPress={closeModal}
    >
      <Text style={styles.modalCompleteButtonText}>Đóng</Text>
    </TouchableOpacity>
  )}
</View>
              </>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingVertical: 8,
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
  filterContainer: {
  paddingHorizontal: 16,
  paddingTop: 10,
  paddingBottom: 20,
},

  filterButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 32,
    paddingVertical: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  content: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    marginTop: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tasksList: {
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  taskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskRoom: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  taskType: {
    fontSize: 14,
    color: '#374151',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  taskDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  noteContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startButton: {
    backgroundColor: '#3b82f6',
  },
  completeButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    marginTop:10,
    paddingTop:10,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  flex: 1,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
  },
    modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // Thêm padding dưới để tránh bị footer che
  },

  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  modalText: {
    fontSize: 16,
    color: '#1f2937',
  },
  noteInput: {
    borderWidth: 3,
    borderColor: '#ef4444',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    color: '#1f2937',
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20, // Thêm padding dưới
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
    // Giữ footer luôn ở dưới cùng
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  modalCancelButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48, // Cố định chiều cao
  },

  modalCancelButtonText: {
    color: '#6b7280',
    fontSize: 14, // Giảm font size
    fontWeight: '600',
  },

  modalCompleteButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48, // Cố định chiều cao
  },

  modalCompleteButtonText: {
    color: 'white',
    fontSize: 14, // Giảm font size
    fontWeight: '600',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  infoTextRight: {
    fontSize: 13,
    color: '#6b7280',
  },
});