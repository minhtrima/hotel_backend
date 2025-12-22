const Room = require("../models/room");
const Booking = require("../models/booking");
const ApiError = require("../utils/api-error");

// Create new room
exports.createRoom = async (req, res) => {
  try {
    const roomData = req.body;

    // Check for existing room number
    const existingRoom = await Room.findOne({
      roomNumber: roomData.roomNumber,
    });
    if (existingRoom) {
      return res
        .status(400)
        .json({ success: false, message: "Room number already exists" });
    }

    const newRoom = new Room(roomData);
    await newRoom.save();

    res.status(201).json({ success: true, room: newRoom });
  } catch (error) {
    console.error("Error creating room:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error creating room", error });
  }
};

// Get all rooms (with type populated)
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate("typeid").sort({ roomNumber: 1 });
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching rooms", error });
  }
};

exports.getAvailableRoom = async (req, res) => {
  const checkInDate = req.query.checkInDate;
  const checkOutDate = req.query.checkOutDate;
  const typeId = req.query.typeId;
  const isClient = req.query.client === "true";
  const excludeBookingId = req.query.excludeBookingId; // Exclude this booking from conflict check

  if (!checkInDate || !checkOutDate) {
    return res.status(400).json({ success: false, message: "Missing dates" });
  }

  // Hàm chuẩn hóa ngày về 00:00:00 UTC
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  try {
    const roomQuery = {};
    if (typeId) roomQuery.typeid = typeId;

    const allRooms = await Room.find(roomQuery)
      .populate("typeid")
      .sort({ roomNumber: 1 });

    // Lấy booking conflict - need to check room-level dates, not booking-level
    const bookingQuery = {
      status: { $in: ["pending", "booked", "checked_in"] }, // Include pending status for current booking
      $or: [
        {
          "rooms.expectedCheckInDate": { $lte: new Date(checkOutDate) },
          "rooms.expectedCheckOutDate": { $gte: new Date(checkInDate) },
        },
        {
          "rooms.actualCheckInDate": { $lte: new Date(checkOutDate) },
          "rooms.actualCheckOutDate": { $gte: new Date(checkInDate) },
        },
      ],
    };

    // Exclude current booking if editing
    if (excludeBookingId) {
      bookingQuery._id = { $ne: excludeBookingId };
    }

    const conflictBookings = await Booking.find(bookingQuery);

    // Đếm phòng conflict
    const conflictRoomIds = new Set();
    const reservedTypeCounts = {};

    console.log(`\n=== ROOM AVAILABILITY DEBUG ===`);
    console.log(`Dates: ${checkInDate} to ${checkOutDate}`);
    console.log(`Is client: ${isClient}`);
    console.log(`Found ${conflictBookings.length} conflict bookings`);

    for (const booking of conflictBookings) {
      console.log(
        `\nProcessing booking: ${booking._id} (status: ${booking.status})`
      );
      console.log(`Booking has ${booking.rooms.length} rooms`);

      for (const room of booking.rooms) {
        const expectedConflict =
          room.expectedCheckInDate &&
          room.expectedCheckOutDate &&
          new Date(room.expectedCheckInDate) <= new Date(checkOutDate) &&
          new Date(room.expectedCheckOutDate) >= new Date(checkInDate);

        const actualConflict =
          room.actualCheckInDate &&
          room.actualCheckOutDate &&
          new Date(room.actualCheckInDate) <= new Date(checkOutDate) &&
          new Date(room.actualCheckOutDate) >= new Date(checkInDate);

        console.log(
          `  Room in booking: roomid=${room.roomid || "null"}, desiredRoomTypeId=${room.desiredRoomTypeId || "null"}`
        );
        console.log(
          `  Expected conflict: ${expectedConflict}, Actual conflict: ${actualConflict}`
        );

        if (expectedConflict || actualConflict) {
          if (room.roomid) {
            conflictRoomIds.add(room.roomid.toString());
            console.log(`    → Added specific room conflict: ${room.roomid}`);
          } else if (room.desiredRoomTypeId) {
            const tid = room.desiredRoomTypeId.toString();
            reservedTypeCounts[tid] = (reservedTypeCounts[tid] || 0) + 1;
            console.log(
              `    → Added type reservation: ${tid} (count: ${reservedTypeCounts[tid]})`
            );
          }
        }
      }
    }

    console.log(`\nFinal conflict summary:`);
    console.log(`- Specific room conflicts: ${conflictRoomIds.size}`);
    console.log(`- Type reservations:`, reservedTypeCounts);

    // Sử dụng hàm chuẩn hóa ngày
    const today = normalizeDate(new Date());

    // ⭐ QUAN TRỌNG: Tạo map checkout chỉ cho các phòng đã check-in (có actualCheckInDate)
    const roomCheckoutMap = new Map();

    // Lấy TẤT CẢ booking để kiểm tra checkout date
    const allBookings = await Booking.find({
      status: { $in: ["pending", "booked", "checked_in"] },
    });

    for (const booking of allBookings) {
      for (const room of booking.rooms) {
        // ⭐ CHỈ XÉT CÁC PHÒNG ĐÃ CHECK-IN (có actualCheckInDate)
        if (
          !room.roomid ||
          !room.actualCheckInDate ||
          !room.expectedCheckOutDate
        )
          continue;

        const checkoutDate = normalizeDate(room.expectedCheckOutDate);
        const roomIdStr = room.roomid.toString();

        console.log(`\n=== CHECKOUT DEBUG ===`);
        console.log(`Room: ${roomIdStr}`);
        console.log(`Booking ID: ${booking._id}`);
        console.log(`Booking status: ${booking.status}`);
        console.log(`Room status in booking: ${room.status}`);
        console.log(
          `Original expectedCheckOutDate: ${room.expectedCheckOutDate}`
        );
        console.log(`Normalized checkoutDate: ${checkoutDate.toISOString()}`);
        console.log(`Today: ${today.toISOString()}`);
        console.log(`Checkout timestamp: ${checkoutDate.getTime()}`);
        console.log(`Today timestamp: ${today.getTime()}`);
        console.log(`Is today? ${checkoutDate.getTime() === today.getTime()}`);
        console.log(`Is past? ${checkoutDate.getTime() < today.getTime()}`);
        console.log(`=== END DEBUG ===`);

        // So sánh ngày đã chuẩn hóa
        if (checkoutDate.getTime() === today.getTime()) {
          roomCheckoutMap.set(roomIdStr, "today");
          console.log(
            `  → Room ${roomIdStr} checkout TODAY: ${room.expectedCheckOutDate}`
          );
        } else if (checkoutDate.getTime() < today.getTime()) {
          roomCheckoutMap.set(roomIdStr, "past");
          console.log(
            `  → Room ${roomIdStr} checkout PAST (OVERDUE): ${room.expectedCheckOutDate}`
          );
        } else {
          console.log(
            `  → Room ${roomIdStr} checkout in future: ${room.expectedCheckOutDate}`
          );
        }
      }
    }

    console.log(`\nCheckout map (rooms with actual check-in):`);
    console.log([...roomCheckoutMap.entries()]);

    // Gán trạng thái phòng với visibleStatus
    const resultRooms = allRooms.map((room) => {
      const r = room.toObject();
      const roomIdStr = room._id.toString();

      // Keep actual status unchanged
      // Add visibleStatus to show status for selected date range
      r.visibleStatus = r.status;

      if (conflictRoomIds.has(roomIdStr)) {
        if (r.status === "occupied") {
          r.visibleStatus = "occupied";
        } else {
          r.visibleStatus = "booked";
        }
      } else if (r.status === "occupied") {
        r.visibleStatus = "available";
      }

      // ⭐ CHỈ GÁN CHECKOUT NẾU CÓ TRONG MAP
      if (roomCheckoutMap.has(roomIdStr)) {
        r.checkout = roomCheckoutMap.get(roomIdStr);
        console.log(
          `Assigned checkout "${r.checkout}" to room ${room.roomNumber}`
        );
      }

      return r;
    });

    // ⭐ Đánh dấu type giữ chỗ (apply for both client AND staff)
    Object.entries(reservedTypeCounts).forEach(([tid, count]) => {
      // Get all rooms of this type, sorted by room number
      const typeRooms = resultRooms
        .filter(
          (r) => (r.typeid._id?.toString?.() || r.typeid.toString?.()) === tid
        )
        .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

      // Find available rooms (use visibleStatus, not actual status)
      const availableRooms = typeRooms.filter(
        (r) => r.visibleStatus === "available"
      );

      console.log(`Type ${tid}: need to reserve ${count} rooms`);
      console.log(
        `Available rooms for type ${tid}:`,
        availableRooms.map((r) => r.roomNumber)
      );

      // Mark the first 'count' available rooms as booked (visibleStatus only)
      for (let i = 0; i < Math.min(count, availableRooms.length); i++) {
        availableRooms[i].visibleStatus = "booked";
        console.log(
          `Marked room ${availableRooms[i].roomNumber} visibleStatus as booked for type reservation`
        );
      }
    });

    // Client trả grouped
    if (isClient && !typeId) {
      const grouped = {};
      resultRooms.forEach((r) => {
        const tid = r.typeid._id?.toString() || r.typeid.toString();
        if (!grouped[tid]) grouped[tid] = [];
        grouped[tid].push(r);
      });
      return res.status(200).json({ success: true, roomsByType: grouped });
    }

    // Staff + client có typeId
    res.status(200).json({ success: true, rooms: resultRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error });
  }
};
// Get single room by ID
exports.getRoomById = async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId).populate("typeid");
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }
    res.status(200).json({ success: true, room });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching room", error });
  }
};

exports.getRoomForCheckIn = async (req, res) => {
  try {
    const typeId = req.params.typeId;
    const rooms = await Room.find({
      typeid: typeId,
      status: "available",
    })
      .populate("typeid")
      .sort({ roomNumber: 1 });
    if (!rooms || rooms.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No rooms found for this type" });
    }
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching rooms by type", error });
  }
};

// Update room
exports.updateRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const updatedData = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // Optional: prevent duplicate room number when updating
    if (updatedData.roomNumber && updatedData.roomNumber !== room.roomNumber) {
      const duplicate = await Room.findOne({
        roomNumber: updatedData.roomNumber,
      });
      if (duplicate) {
        return res
          .status(400)
          .json({ success: false, message: "Room number already in use" });
      }
    }

    Object.assign(room, updatedData);
    await room.save();

    res
      .status(200)
      .json({ success: true, room, message: "Room updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating room", error });
  }
};

// Update room status (including DND, housekeeping status, etc.)
exports.updateRoomStatus = async (req, res) => {
  try {
    const roomId = req.params.id;
    const statusData = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // Update room with new status data
    const updatedRoom = await Room.findByIdAndUpdate(roomId, statusData, {
      new: true,
    }).populate("typeid");

    res.status(200).json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error("Error updating room status:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating room status", error });
  }
};

// Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    await Room.findByIdAndDelete(roomId);
    res
      .status(200)
      .json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting room", error });
  }
};
