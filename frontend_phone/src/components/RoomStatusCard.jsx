import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const RoomStatusCard = ({ room, onPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "#10b981"; // green
      case "occupied":
        return "#f59e0b"; // yellow
      case "cleaning":
        return "#3b82f6"; // blue
      case "clean":
        return "#10b981"; // green
      case "dirty":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "available":
        return "Trống";
      case "occupied":
        return "Có khách";
      case "cleaning":
        return "Đang dọn";
      case "clean":
        return "Sạch";
      case "dirty":
        return "Bẩn";
      default:
        return status;
    }
  };

  const getHousekeepingStatusText = (status) => {
    switch (status) {
      case "cleaning":
        return "Đang dọn";
      case "clean":
        return "Đã dọn";
      case "dirty":
        return "Cần dọn";
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(room)}>
      <View style={styles.cardHeader}>
        <Text style={styles.roomNumber}>Phòng {room.roomNumber}</Text>
        <Text style={styles.floor}>Tầng {room.floor}</Text>
        {room.doNotDisturb && (
          <View style={styles.dndBadge}>
            <Text style={styles.dndText}>DND</Text>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Trạng thái:</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(room.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(room.status)}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Dọn dẹp:</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(room.housekeepingStatus) },
            ]}
          >
            <Text style={styles.statusText}>
              {getHousekeepingStatusText(room.housekeepingStatus)}
            </Text>
          </View>
        </View>
      </View>

      {room.currentTask && (
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>
            Công việc: {room.currentTask.title}
          </Text>
          <Text style={styles.taskStatus}>
            Trạng thái:{" "}
            {room.currentTask.status === "pending"
              ? "Chờ xử lý"
              : room.currentTask.status === "in-progress"
              ? "Đang thực hiện"
              : "Hoàn thành"}
          </Text>
        </View>
      )}

      <Text style={styles.typeText}>
        Loại phòng: {room.typeid?.name || "N/A"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  floor: {
    fontSize: 14,
    color: "#6b7280",
  },
  dndBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dndText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  statusBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  taskInfo: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 12,
    color: "#6b7280",
  },
  typeText: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});

export default RoomStatusCard;
