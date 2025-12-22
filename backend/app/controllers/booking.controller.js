const Booking = require("../models/booking");
const Room = require("../models/room");
const Customer = require("../models/customer");
const Type = require("../models/type");
const Service = require("../models/service");
const Payment = require("../models/payment");
const Task = require("../models/task");
const Staff = require("../models/staff");
const InventorySlip = require("../models/inventorySlip");
const Inventory = require("../models/inventory");
const ApiError = require("../utils/api-error");

// Helper function to update payment status based on booking total price
async function updateBookingPaymentStatus(bookingId) {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    // Get all paid payments for this booking
    const payments = await Payment.find({
      bookingId: bookingId,
      status: "paid",
    });

    const totalPaid = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalPrice = booking.totalPrice || 0;

    console.log(`=== Payment Status Update ===`);
    console.log(`Booking: ${bookingId}`);
    console.log(`Total Price: ${totalPrice}`);
    console.log(`Total Paid: ${totalPaid}`);

    let newPaymentStatus;
    if (totalPaid === 0) {
      newPaymentStatus = "unpaid";
    } else if (totalPaid >= totalPrice) {
      newPaymentStatus = "paid";
    } else {
      newPaymentStatus = "partially_paid";
    }

    console.log(`New Payment Status: ${newPaymentStatus}`);

    if (booking.paymentStatus !== newPaymentStatus) {
      booking.paymentStatus = newPaymentStatus;
      await booking.save();
      console.log(`Payment status updated to: ${newPaymentStatus}`);
    }
  } catch (error) {
    console.error("Error updating payment status:", error);
  }
}

async function generateBookingCode() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(2); // last 2 digits
  const codeMonth = `${month}${year}`; // MMYY

  // get highest sequence for this month
  const lastBooking = await Booking.findOne({ codeMonth })
    .sort({ sequenceNumber: -1 })
    .select("sequenceNumber");

  let nextSeq = 1;

  if (lastBooking && lastBooking.sequenceNumber) {
    nextSeq = lastBooking.sequenceNumber + 1;
  }

  const paddedSeq = String(nextSeq).padStart(5, "0");
  const bookingCode = `BK-${codeMonth}-${paddedSeq}`;

  return {
    bookingCode,
    sequenceNumber: nextSeq,
    codeMonth,
  };
}

// Helper function to calculate total booking price
function calculateBookingTotalPrice(booking) {
  try {
    console.log("=== Calculating total price for booking ===");
    console.log("Booking status:", booking.status);

    // Calculate room prices based on actual or expected dates
    const totalRoomPrice = (booking.rooms || []).reduce((total, room) => {
      // Calculate nights based on actual dates if available, otherwise use expected dates
      let nights = 0;

      console.log(`--- Room ${room.roomSnapshot?.roomNumber || "Unknown"} ---`);

      if (room.actualCheckInDate && room.actualCheckOutDate) {
        console.log("Using actual dates:");
        console.log("  actualCheckInDate:", room.actualCheckInDate);
        console.log("  actualCheckOutDate:", room.actualCheckOutDate);

        const checkInDate = new Date(room.actualCheckInDate);
        const checkOutDate = new Date(room.actualCheckOutDate);
        const timeDiffMs = checkOutDate.getTime() - checkInDate.getTime();

        console.log("  timeDiff (ms):", timeDiffMs);

        // Calculate nights - if less than 1 day, round up to 1
        nights = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)));
        console.log("  calculated nights:", nights);

        // For completed bookings, ensure minimum 1 night charge regardless
        if (booking.status === "completed") {
          nights = Math.max(nights, 1);
        }
        console.log("  final nights (after min 1 for completed):", nights);
      } else if (room.expectedCheckInDate && room.expectedCheckOutDate) {
        console.log("Using expected dates:");
        console.log("  expectedCheckInDate:", room.expectedCheckInDate);
        console.log("  expectedCheckOutDate:", room.expectedCheckOutDate);

        const checkInDate = new Date(room.expectedCheckInDate);
        const checkOutDate = new Date(room.expectedCheckOutDate);
        const timeDiffMs = checkOutDate.getTime() - checkInDate.getTime();

        console.log("  timeDiff (ms):", timeDiffMs);

        nights = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)));
        console.log("  calculated nights:", nights);
      } else {
        console.log("  No dates found, defaulting to 1 night");
        nights = 1;
      }

      // Use the pricePerNight from the room object (which should be set during booking creation)
      const pricePerNight =
        room.pricePerNight ||
        (room.desiredRoomTypeId && room.desiredRoomTypeId.pricePerNight) ||
        0;
      console.log("  pricePerNight:", pricePerNight);

      const roomPrice = pricePerNight * nights;
      console.log("  roomPrice:", roomPrice);

      // Add room additional services price
      const roomServicesPrice = (room.additionalServices || []).reduce(
        (serviceTotal, service) =>
          serviceTotal + (service.price || 0) * (service.quantity || 1),
        0
      );

      console.log("  roomServicesPrice:", roomServicesPrice);

      const totalForRoom = roomPrice + roomServicesPrice;
      console.log("  totalForRoom:", totalForRoom);

      return total + totalForRoom;
    }, 0);

    console.log("totalRoomPrice:", totalRoomPrice);

    // Calculate transportation services price
    const totalTransportationPrice = (booking.services || []).reduce(
      (total, service) =>
        total + (service.price || 0) * (service.quantity || 1),
      0
    );

    console.log("totalTransportationPrice:", totalTransportationPrice);

    const finalTotal = totalRoomPrice + totalTransportationPrice;
    console.log("finalTotal:", finalTotal);
    console.log("=== End calculation ===");

    return finalTotal;
  } catch (error) {
    console.error("Error calculating total price:", error);
    return 0;
  }
}

exports.createBooking = async (req, res, next) => {
  try {
    console.log("Creating booking with data:", req.body);
    const customerData = await Customer.findById(req.body.customerid);
    if (!customerData)
      return next(new ApiError(404, "Không tìm thấy khách hàng"));

    // Conflict check: ensure at least one room of the desired type is available for each booking room
    for (let i = 0; i < req.body.rooms.length; i++) {
      const room = req.body.rooms[i];
      const typeId = room.desiredRoomTypeId?._id || room.desiredRoomTypeId; // Extract _id if it's an object

      // Lấy tất cả phòng thuộc loại này
      const availableRooms = await Room.find({ typeid: typeId });
      if (!availableRooms || availableRooms.length === 0) {
        return next(
          new ApiError(404, "Không tìm thấy phòng thuộc loại đã chọn")
        );
      }
      console.log(req.body);
      // Đếm số booking conflict với loại phòng này trong khoảng thời gian này
      const conflictCount = await Booking.countDocuments({
        status: { $in: ["booked", "checked_in"] },
        "rooms.desiredRoomTypeId": typeId,
        $or: [
          {
            "rooms.expectedCheckInDate": {
              $lte: new Date(room.expectedCheckOutDate),
            },
            "rooms.expectedCheckOutDate": {
              $gte: new Date(room.expectedCheckInDate),
            },
          },
          {
            "rooms.actualCheckInDate": {
              $exists: true,
              $ne: null,
              $lte: new Date(room.expectedCheckOutDate),
            },
            "rooms.actualCheckOutDate": {
              $exists: true,
              $ne: null,
              $gte: new Date(room.expectedCheckInDate),
            },
          },
        ],
      });

      if (conflictCount >= availableRooms.length) {
        return next(
          new ApiError(
            400,
            "Tất cả các phòng thuộc loại đã chọn đều đã được đặt hoặc đang có khách trong khoảng thời gian này."
          )
        );
      }
    }

    // Đếm số lượng phòng mỗi loại trong booking mới
    const typeCount = {};
    for (const room of req.body.rooms) {
      const typeId = room.desiredRoomTypeId?._id || room.desiredRoomTypeId;
      if (!typeId) continue;
      typeCount[typeId] = (typeCount[typeId] || 0) + 1;
    }

    for (const typeId in typeCount) {
      // Lấy tất cả phòng thuộc loại này
      const availableRooms = await Room.find({ typeid: typeId });
      if (!availableRooms || availableRooms.length === 0) {
        return next(
          new ApiError(404, "Không tìm thấy phòng thuộc loại đã chọn")
        );
      }

      // Đếm số booking khác đã chiếm loại phòng này trong khoảng thời gian này
      let conflictCount = 0;
      for (const room of req.body.rooms.filter(
        (r) => (r.desiredRoomTypeId?._id || r.desiredRoomTypeId) == typeId
      )) {
        conflictCount += await Booking.countDocuments({
          status: { $in: ["booked", "checked_in"] },
          "rooms.desiredRoomTypeId": typeId,
          $or: [
            {
              "rooms.expectedCheckInDate": {
                $lte: new Date(room.expectedCheckOutDate),
              },
              "rooms.expectedCheckOutDate": {
                $gte: new Date(room.expectedCheckInDate),
              },
            },
            {
              "rooms.actualCheckInDate": {
                $exists: true,
                $ne: null,
                $lte: new Date(room.expectedCheckOutDate),
              },
              "rooms.actualCheckOutDate": {
                $exists: true,
                $ne: null,
                $gte: new Date(room.expectedCheckInDate),
              },
            },
          ],
        });
      }

      // Tổng số phòng loại này bị chiếm = conflictCount + số phòng loại này trong booking hiện tại
      if (conflictCount + typeCount[typeId] > availableRooms.length) {
        const conflictedType = await Type.findById(typeId);
        return next(
          new ApiError(
            400,
            `Chỉ còn ${
              availableRooms.length - conflictCount
            } phòng thuộc loại ${conflictedType.name}, nhưng bạn đang đặt ${typeCount[typeId]} phòng.`
          )
        );
      }
    }

    // Do NOT assign roomid here, just save booking with desiredRoomTypeId
    // Remove empty roomid fields before saving
    const cleanedRooms = req.body.rooms.map((room) => {
      const r = { ...room };
      if (!r.roomid) delete r.roomid;
      // Đảm bảo giữ lại desiredRoomTypeId
      return r;
    });

    // Generate booking code
    const codeData = await generateBookingCode();

    const newBooking = new Booking({
      ...req.body,
      bookingCode: codeData.bookingCode,
      sequenceNumber: codeData.sequenceNumber,
      codeMonth: codeData.codeMonth,
      customerSnapshot: {
        honorific: customerData.honorific,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phoneNumber: customerData.phoneNumber,
        identificationNumber: customerData.identificationNumber,
      },
      rooms: cleanedRooms,
    });

    newBooking.status = "booked";

    await newBooking.save();

    res.status(201).json({ success: true, booking: newBooking });
  } catch (error) {
    console.log("lỗi khi tạo booking:", error);
    next(new ApiError(500, "Booking failed"));
  }
};

exports.checkInBooking = async (req, res, next) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    if (booking.status !== "booked") {
      return next(new ApiError(400, "Đặt phòng không ở trạng thái 'đã đặt'"));
    }

    // Cập nhật roomid nếu gửi từ frontend
    if (req.body.rooms && Array.isArray(req.body.rooms)) {
      req.body.rooms.forEach((room, idx) => {
        if (room.roomid) {
          booking.rooms[idx].roomid = room.roomid;
        }
      });
    }

    booking.status = "checked_in";
    for (let i = 0; i < booking.rooms.length; i++) {
      booking.rooms[i].actualCheckInDate = new Date();
      booking.rooms[i].status = "checked_in";
      console.log("Booking room:", booking.rooms[i]);
      // Lấy thông tin phòng và lưu vào roomSnapshot
      if (booking.rooms[i].roomid) {
        const roomDoc = await Room.findById(booking.rooms[i].roomid).populate(
          "typeid"
        );
        if (roomDoc) {
          booking.rooms[i].roomSnapshot = {
            roomNumber: roomDoc.roomNumber,
            typeName: roomDoc.typeid?.name || "",
          };
        }
        await Room.findByIdAndUpdate(booking.rooms[i].roomid, {
          status: "occupied",
        });
      }
    }
    await booking.save();

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.log("Error during check-in:", error);
    next(new ApiError(500, "Check-in failed"));
  }
};

// Helper function to generate receipt data
const generateReceiptData = (booking, checkedOutRoomIds) => {
  const checkedOutRooms = booking.rooms.filter((room) => {
    const roomId =
      typeof room.roomid === "object" && room.roomid !== null
        ? room.roomid._id?.toString?.() || room.roomid.toString?.()
        : room.roomid?.toString?.();
    return checkedOutRoomIds.includes(roomId);
  });

  // Calculate room details
  const roomDetails = checkedOutRooms.map((room) => {
    const checkIn = room.actualCheckInDate || room.expectedCheckInDate;
    const checkOut = room.actualCheckOutDate || new Date();
    const nights = Math.max(
      1,
      Math.ceil((checkOut - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    );

    return {
      roomNumber: room.roomid?.roomNumber || "N/A",
      roomType: room.desiredRoomTypeId?.name || "N/A",
      nights: nights,
      pricePerNight: room.pricePerNight || 0,
      totalPrice: (room.pricePerNight || 0) * nights,
      checkIn: checkIn,
      checkOut: checkOut,
    };
  });

  const roomTotal = roomDetails.reduce((sum, room) => sum + room.totalPrice, 0);

  // Collect all services
  const allServices = [];

  // Room services
  checkedOutRooms.forEach((room) => {
    if (room.additionalServices && room.additionalServices.length > 0) {
      room.additionalServices.forEach((service) => {
        allServices.push({
          name: service.serviceId?.name || "Dịch vụ",
          quantity: service.quantity || 1,
          price: service.price || 0,
          totalPrice: (service.price || 0) * (service.quantity || 1),
        });
      });
    }
  });

  // General services
  if (booking.services && booking.services.length > 0) {
    booking.services.forEach((service) => {
      allServices.push({
        name: service.serviceId?.name || "Dịch vụ",
        quantity: service.quantity || 1,
        price: service.price || 0,
        totalPrice: (service.price || 0) * (service.quantity || 1),
      });
    });
  }

  const servicesTotal = allServices.reduce(
    (sum, service) => sum + service.totalPrice,
    0
  );

  // Calculate earliest check-in and latest check-out
  const checkInDates = roomDetails.map((r) => new Date(r.checkIn));
  const checkOutDates = roomDetails.map((r) => new Date(r.checkOut));
  const earliestCheckIn = new Date(Math.min(...checkInDates));
  const latestCheckOut = new Date(Math.max(...checkOutDates));
  const totalNights = Math.max(
    1,
    Math.ceil((latestCheckOut - earliestCheckIn) / (1000 * 60 * 60 * 24))
  );

  return {
    bookingCode: booking.bookingCode,
    checkInDate: earliestCheckIn,
    checkOutDate: latestCheckOut,
    totalNights: totalNights,
    rooms: roomDetails,
    services: allServices,
    roomTotal: roomTotal,
    servicesTotal: servicesTotal,
    totalAmount: roomTotal + servicesTotal,
    customer: {
      honorific: booking.customerSnapshot?.honorific || "",
      firstName: booking.customerSnapshot?.firstName || "",
      lastName: booking.customerSnapshot?.lastName || "",
      email: booking.customerid?.email || "",
      phoneNumber: booking.customerSnapshot?.phoneNumber || "",
    },
  };
};

exports.checkOut = async (req, res, next) => {
  const { bookingId } = req.params;
  const { roomIds, staffId } = req.body; // nhận mảng roomId và staffId từ frontend

  try {
    const booking = await Booking.findById(bookingId).populate(
      "rooms.desiredRoomTypeId"
    );
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    console.log(booking);
    if (booking.status !== "checked_in") {
      return next(
        new ApiError(400, "Đặt phòng không ở trạng thái 'đã nhận phòng'")
      );
    }

    // Chỉ cập nhật các phòng được chọn
    let changed = false;
    const checkedOutRoomIds = [];

    for (let i = 0; i < booking.rooms.length; i++) {
      const room = booking.rooms[i];
      const roomId =
        typeof room.roomid === "object" && room.roomid !== null
          ? room.roomid._id?.toString?.() || room.roomid.toString?.()
          : room.roomid?.toString?.();

      if (roomIds.includes(roomId)) {
        booking.rooms[i].actualCheckOutDate = new Date();
        booking.rooms[i].status = "completed";

        // Update room status to available and housekeepingStatus to cleaning
        await Room.findByIdAndUpdate(room.roomid, {
          status: "available",
          housekeepingStatus: "cleaning",
        });

        checkedOutRoomIds.push(roomId);
        changed = true;
      }
    }

    // Nếu tất cả các phòng đều completed thì mới set booking.status = completed
    const allRoomsCompleted = booking.rooms.every(
      (room) => room.status === "completed"
    );
    if (allRoomsCompleted && changed) {
      booking.status = "completed";
    }

    // Calculate and update total price
    const totalPrice = calculateBookingTotalPrice(booking);
    booking.totalPrice = totalPrice;
    await booking.save();

    // Update payment status based on new total
    await updateBookingPaymentStatus(booking._id);

    // Create inventory slips for minibar services
    try {
      // Collect all minibar services from rooms and general services
      const minibarServicesToProcess = [];

      // Process room-specific services
      for (let i = 0; i < booking.rooms.length; i++) {
        const room = booking.rooms[i];
        const roomId =
          typeof room.roomid === "object" && room.roomid !== null
            ? room.roomid._id?.toString?.() || room.roomid.toString?.()
            : room.roomid?.toString?.();

        // Only process checked out rooms
        if (checkedOutRoomIds.includes(roomId) && room.additionalServices) {
          for (const svc of room.additionalServices) {
            const serviceData = await Service.findById(svc.serviceId).populate(
              "inventoryItemId"
            );

            if (
              serviceData &&
              serviceData.category === "minibar" &&
              serviceData.inventoryItemId &&
              serviceData.inventoryItemId.length > 0
            ) {
              minibarServicesToProcess.push({
                roomId: roomId,
                service: serviceData,
                quantity: svc.quantity || 1,
              });
            }
          }
        }
      }

      // Process general services (not tied to specific room)
      if (booking.services && booking.services.length > 0) {
        for (const svc of booking.services) {
          const serviceData = await Service.findById(svc.serviceId).populate(
            "inventoryItemId"
          );

          if (
            serviceData &&
            serviceData.category === "minibar" &&
            serviceData.inventoryItemId &&
            serviceData.inventoryItemId.length > 0
          ) {
            minibarServicesToProcess.push({
              roomId: null, // General service, no specific room
              service: serviceData,
              quantity: svc.quantity || 1,
            });
          }
        }
      }

      // Create inventory slip for each minibar service
      if (minibarServicesToProcess.length > 0) {
        const checkoutStaffId =
          staffId || req.body.checkoutStaffId || booking.createdBy;

        if (!checkoutStaffId) {
          console.warn("No staffId available for creating inventory slip");
        } else {
          for (const minibarService of minibarServicesToProcess) {
            // Prepare items for inventory slip
            const items = [];

            for (const invId of minibarService.service.inventoryItemId) {
              const inventoryItem = await Inventory.findById(invId);

              if (inventoryItem) {
                items.push({
                  inventoryId: invId,
                  quantity: minibarService.quantity, // Use service quantity
                  inventoryType: inventoryItem.type,
                  condition: "USED",
                });

                // Update inventory quantity (subtract)
                inventoryItem.quantity = Math.max(
                  0,
                  inventoryItem.quantity - minibarService.quantity
                );
                await inventoryItem.save();
              }
            }

            if (items.length > 0) {
              // Create inventory slip
              const inventorySlip = await InventorySlip.create({
                roomId: minibarService.roomId,
                staffId: checkoutStaffId,
                type: "MINIBAR",
                items: items,
                note: `Sử dụng minibar: ${minibarService.service.name} (checkout booking ${booking.bookingCode || booking._id})`,
              });

              console.log(
                `Created inventory slip ${inventorySlip._id} for minibar service ${minibarService.service.name}`
              );
            }
          }
        }
      }
    } catch (invError) {
      console.error("Error creating minibar inventory slips:", invError);
      // Don't fail checkout if inventory slip creation fails
    }

    // Create housekeeping tasks for checked out rooms
    if (checkedOutRoomIds.length > 0) {
      // Find housekeeping staff - prioritize the provided staffId if exists
      let housekeepingStaff = null;

      if (staffId) {
        housekeepingStaff = await Staff.findById(staffId);
        if (
          housekeepingStaff &&
          housekeepingStaff.position !== "housekeeping"
        ) {
          housekeepingStaff = null;
        }
      }

      // If no valid staffId provided, get first available housekeeping staff
      if (!housekeepingStaff) {
        housekeepingStaff = await Staff.findOne({ position: "housekeeping" });
      }

      if (housekeepingStaff) {
        // Create cleaning tasks for each checked out room
        const tasks = [];
        for (const roomId of checkedOutRoomIds) {
          const roomInfo = await Room.findById(roomId).populate("typeid");

          const task = await Task.create({
            title: `Dọn phòng sau checkout - ${roomInfo.roomNumber}`,
            roomId: roomId,
            assignedBy: req.body.checkoutStaffId || housekeepingStaff._id, // Staff who performed checkout
            assignedTo: housekeepingStaff._id,
            taskType: "cleaning",
            description: `Dọn dẹp phòng ${roomInfo.roomNumber} (${roomInfo.typeid?.name || ""}) sau khi khách checkout`,
            status: "pending",
            priority: "high",
          });

          tasks.push(task);
        }

        // Emit socket events for phone app
        try {
          const io = req.app && req.app.get("io");
          if (io) {
            // Emit room updates
            checkedOutRoomIds.forEach((roomId) => {
              io.emit("rooms:housekeeping:update", {
                roomId,
                housekeepingStatus: "cleaning",
              });
            });

            // Emit task creation
            io.emit("tasks:refresh", {
              staffId: housekeepingStaff._id,
              rooms: checkedOutRoomIds,
            });

            // Emit general notification
            io.emit("checkout:completed", {
              bookingId: booking._id,
              rooms: checkedOutRoomIds,
              tasksCreated: tasks.length,
            });
          }
        } catch (emitErr) {
          console.error("Error emitting socket events in checkOut:", emitErr);
        }

        console.log(
          `Created ${tasks.length} housekeeping tasks for staff ${housekeepingStaff.name}`
        );
      } else {
        console.warn("No housekeeping staff found to assign cleaning tasks");
      }
    }

    // Generate receipt data
    const populatedBooking = await Booking.findById(booking._id)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate("rooms.additionalServices.serviceId")
      .populate("services.serviceId");

    const receiptData = generateReceiptData(
      populatedBooking,
      checkedOutRoomIds
    );

    // Send receipt email if customer has email
    if (populatedBooking.customerid?.email) {
      try {
        const { sendReceiptEmail } = require("../utils/emailService");
        await sendReceiptEmail(
          populatedBooking,
          populatedBooking.customerid,
          receiptData
        );
        console.log(
          "Receipt email sent to:",
          populatedBooking.customerid.email
        );
      } catch (emailError) {
        console.error("Error sending receipt email:", emailError);
        // Don't fail checkout if email fails
      }
    }

    res.status(200).json({
      success: true,
      bookingId: booking._id,
      message: "Trả phòng thành công",
      receiptData: receiptData,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    next(new ApiError(500, "Checkout failed"));
  }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate({
        path: "rooms.additionalServices.serviceId",
        model: "Service",
      })
      .populate({
        path: "services.serviceId",
        model: "Service",
      });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.log("Error fetching bookings:", error);
    next(new ApiError(500, "Lỗi khi lấy danh sách đặt phòng"));
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const bookingData = await Booking.findById(bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate({
        path: "rooms.additionalServices.serviceId",
        model: "Service",
      })
      .populate({
        path: "services.serviceId",
        model: "Service",
      });

    if (!bookingData) {
      return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    }
    res.status(200).json({ success: true, booking: bookingData });
  } catch (error) {
    next(new ApiError(500, "Lỗi khi lấy thông tin đặt phòng"));
  }
};

exports.updateBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const updatedData = req.body;

    console.log("=== Updating booking ===");
    console.log("Booking ID:", bookingId);
    console.log(
      "Updated data rooms:",
      updatedData.rooms?.map((r) => ({
        additionalGuests: r.additionalGuests,
        mainGuest: r.mainGuest,
      }))
    );

    const bookingData = await Booking.findById(bookingId);
    if (!bookingData) {
      return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    }

    if (
      bookingData.status === "completed" ||
      bookingData.status === "cancelled"
    ) {
      return next(new ApiError(400, "Không thể cập nhật đặt phòng này"));
    }

    // --- Kiểm tra conflict phòng khi cập nhật ---
    if (Array.isArray(updatedData.rooms)) {
      // Đếm số lượng phòng mỗi loại trong booking cập nhật
      const typeCount = {};
      for (const room of updatedData.rooms) {
        const typeId = room.desiredRoomTypeId?._id || room.desiredRoomTypeId;
        if (!typeId) continue;
        typeCount[typeId] = (typeCount[typeId] || 0) + 1;
      }

      for (const typeId in typeCount) {
        // Lấy tất cả phòng thuộc loại này
        const availableRooms = await Room.find({ typeid: typeId });
        if (!availableRooms || availableRooms.length === 0) {
          return next(
            new ApiError(404, "Không tìm thấy phòng thuộc loại đã chọn")
          );
        }

        // Đếm số booking khác đã chiếm loại phòng này trong khoảng thời gian này
        let conflictCount = 0;
        for (const room of updatedData.rooms.filter(
          (r) => (r.desiredRoomTypeId?._id || r.desiredRoomTypeId) == typeId
        )) {
          conflictCount += await Booking.countDocuments({
            _id: { $ne: bookingId },
            status: { $in: ["booked", "checked_in"] },
            "rooms.desiredRoomTypeId": typeId,
            $or: [
              {
                "rooms.expectedCheckInDate": {
                  $lte: new Date(room.expectedCheckOutDate),
                },
                "rooms.expectedCheckOutDate": {
                  $gte: new Date(room.expectedCheckInDate),
                },
              },
              {
                "rooms.actualCheckInDate": {
                  $lte: new Date(room.expectedCheckOutDate),
                },
                "rooms.actualCheckOutDate": {
                  $gte: new Date(room.expectedCheckInDate),
                },
              },
            ],
          });
        }

        // Tổng số phòng loại này bị chiếm = conflictCount + số phòng loại này trong booking hiện tại
        if (conflictCount + typeCount[typeId] > availableRooms.length) {
          const conflictedType = await Type.findById(typeId);
          return next(
            new ApiError(
              400,
              `Chỉ còn ${
                availableRooms.length - conflictCount
              } phòng thuộc loại ${conflictedType.name}, nhưng bạn đang đặt ${typeCount[typeId]} phòng.`
            )
          );
        }
      }

      // Kiểm tra conflict từng phòng cụ thể (nếu có roomid)
      for (let i = 0; i < updatedData.rooms.length; i++) {
        const room = updatedData.rooms[i];
        if (room.roomid) {
          const conflict = await Booking.findOne({
            _id: { $ne: bookingId },
            "rooms.roomid": room.roomid,
            status: { $in: ["booked", "checked_in"] },
            $or: [
              {
                "rooms.expectedCheckInDate": {
                  $lte: new Date(room.expectedCheckOutDate),
                },
                "rooms.expectedCheckOutDate": {
                  $gte: new Date(room.expectedCheckInDate),
                },
              },
              {
                "rooms.actualCheckInDate": {
                  $lte: new Date(room.expectedCheckOutDate),
                },
                "rooms.actualCheckOutDate": {
                  $gte: new Date(room.expectedCheckInDate),
                },
              },
            ],
          });
          if (conflict) {
            return next(
              new ApiError(
                400,
                `Phòng ${room.roomid} đã được đặt hoặc đang có khách trong khoảng thời gian này.`
              )
            );
          }
        }
      }
    }

    // --- Làm sạch roomid rỗng ---
    if (Array.isArray(updatedData.rooms)) {
      updatedData.rooms = updatedData.rooms.map((room) => {
        if (room.roomid === "") {
          const { roomid, ...rest } = room;
          return rest;
        }
        return room;
      });
    }

    // Tách các trường khác ngoài rooms
    const otherFields = {};
    for (const key in updatedData) {
      if (key !== "rooms") {
        otherFields[key] = updatedData[key];
      }
    }
    if (Array.isArray(updatedData.rooms)) {
      // Xóa _id của từng room mới để tránh lỗi version
      const newRooms = updatedData.rooms.map((room) => {
        const r = { ...room };
        delete r._id;
        return r;
      });
      await Booking.updateOne(
        { _id: bookingId },
        {
          $set: {
            ...otherFields,
            rooms: newRooms,
          },
        }
      );
      const updatedBooking = await Booking.findById(bookingId)
        .populate("customerid")
        .populate("rooms.roomid")
        .populate("rooms.desiredRoomTypeId");

      console.log("=== After update ===");
      console.log(
        "Updated booking rooms with guests:",
        updatedBooking.rooms?.map((r) => ({
          additionalGuests: r.additionalGuests,
          mainGuest: r.mainGuest,
        }))
      );

      // Recalculate price and update payment status
      const totalPrice = calculateBookingTotalPrice(updatedBooking);
      updatedBooking.totalPrice = totalPrice;
      await updatedBooking.save();
      await updateBookingPaymentStatus(updatedBooking._id);

      return res.status(200).json({ success: true, booking: updatedBooking });
    } else {
      Object.assign(bookingData, otherFields);
      await bookingData.save();

      // Recalculate price and update payment status
      const totalPrice = calculateBookingTotalPrice(bookingData);
      bookingData.totalPrice = totalPrice;
      await bookingData.save();
      await updateBookingPaymentStatus(bookingData._id);

      return res.status(200).json({ success: true, booking: bookingData });
    }
  } catch (error) {
    console.log(error);
    next(new ApiError(500, "Lỗi khi cập nhật đặt phòng"));
  }
};

exports.createTemporaryBooking = async (req, res, next) => {
  try {
    const { dayStart, dayEnd, rooms } = req.body;
    if (!dayStart || !dayEnd) {
      return next(
        new ApiError(400, "Ngày bắt đầu và kết thúc không được để trống")
      );
    }

    // Generate booking code
    const codeData = await generateBookingCode();

    // Use rooms from request body or create default room
    const bookingRooms =
      rooms && rooms.length > 0
        ? rooms.map((room) => ({
            expectedCheckInDate: new Date(dayStart) || null,
            expectedCheckOutDate: new Date(dayEnd) || null,
            numberOfAdults: room.numberOfAdults || 1,
            numberOfChildren: room.numberOfChildren || 0,
            status: room.status || "pending",
          }))
        : [
            {
              expectedCheckInDate: new Date(dayStart),
              expectedCheckOutDate: new Date(dayEnd),
              numberOfAdults: 1,
              numberOfChildren: 0,
              status: "pending",
            },
          ];

    const newBooking = new Booking({
      status: "pending",
      bookingCode: codeData.bookingCode,
      sequenceNumber: codeData.sequenceNumber,
      codeMonth: codeData.codeMonth,
      expectedCheckInDate: new Date(dayStart) || null,
      expectedCheckOutDate: new Date(dayEnd) || null,
      rooms: bookingRooms,
    });
    await newBooking.save();
    res.status(201).json({ success: true, booking: newBooking });
  } catch (error) {
    console.log("Error creating temporary booking:", error);
    next(new ApiError(500, "Lỗi khi tạo đặt phòng tạm thời"));
  }
};

exports.updateTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndUpdate(bookingId, req.body, {
      new: true,
    });

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.log("Error updating temporary booking:", error);
    next(new ApiError(500, "Lỗi khi cập nhật đặt phòng tạm thời"));
  }
};

exports.addRoomToTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate(
      "rooms.desiredRoomTypeId"
    );
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    const { room } = req.body;
    const index = room.index;

    console.log("Before update:", booking.rooms[index]);

    // Ensure additionalServices array exists
    if (!booking.rooms[index].additionalServices) {
      booking.rooms[index].additionalServices = [];
    }

    // Update the room with the new data
    booking.rooms[index].desiredRoomTypeId = room.desiredRoomTypeId;
    booking.rooms[index].pricePerNight = room.pricePerNight;
    booking.rooms[index].numberOfAdults = room.numberOfAdults;
    booking.rooms[index].numberOfChildren = room.numberOfChildren;
    booking.rooms[index].status = "pending";

    const type = await Type.findById(room.desiredRoomTypeId);
    if (!type) return next(new ApiError(404, "Không tìm thấy loại phòng"));

    console.log("Room capacity:", type.capacity);
    console.log("Number of adults:", booking.rooms[index].numberOfAdults);

    // Calculate final price including extra bed if needed
    let finalPricePerNight = type.pricePerNight;
    if (
      booking.rooms[index].numberOfAdults > type.capacity &&
      type.extraBedAllowed
    ) {
      finalPricePerNight += type.extraBedPrice;
      console.log("Extra bed added. Final price:", finalPricePerNight);
    }

    // Use findByIdAndUpdate to avoid validation issues with required fields
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          [`rooms.${index}.desiredRoomTypeId`]: room.desiredRoomTypeId,
          [`rooms.${index}.pricePerNight`]: finalPricePerNight,
          [`rooms.${index}.numberOfAdults`]: room.numberOfAdults,
          [`rooms.${index}.numberOfChildren`]: room.numberOfChildren,
          [`rooms.${index}.status`]: "pending",
          [`rooms.${index}.additionalServices`]:
            booking.rooms[index].additionalServices,
        },
      },
      { new: true, runValidators: false }
    ).populate("rooms.desiredRoomTypeId");

    console.log("Booking updated successfully");

    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.log("Error adding room to temporary booking:", error);
    next(new ApiError(500, "Lỗi khi thêm phòng vào đặt phòng tạm thời"));
  }
};

exports.removeRoomFromTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { roomIndex } = req.body; // Nhận roomIndex của phòng cần xóa

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    // Kiểm tra nếu roomIndex hợp lệ
    if (roomIndex < 0 || roomIndex >= booking.rooms.length) {
      return next(new ApiError(400, "Index phòng không hợp lệ"));
    }

    // Use findByIdAndUpdate to avoid validation issues with required fields
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $unset: {
          [`rooms.${roomIndex}.desiredRoomTypeId`]: 1,
        },
        $set: {
          [`rooms.${roomIndex}.additionalServices`]: [],
        },
      },
      { new: true, runValidators: false }
    ).populate("rooms.desiredRoomTypeId");

    console.log("Room removed successfully");
    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.log("Error removing room from temporary booking:", error);
    next(new ApiError(500, "Lỗi khi xóa phòng khỏi đặt phòng tạm thời"));
  }
};

exports.addTransportationServiceToBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { services } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    // Update booking.services with transportation services
    booking.services = services || [];

    // Use findByIdAndUpdate to avoid validation issues with required fields
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { services: booking.services },
      { new: true, runValidators: false }
    )
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate("services.serviceId");

    // Recalculate total price and update payment status
    const totalPrice = calculateBookingTotalPrice(updatedBooking);
    updatedBooking.totalPrice = totalPrice;
    await updatedBooking.save();
    await updateBookingPaymentStatus(updatedBooking._id);

    return res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.log("Error adding transportation service to booking:", error);
    return next(
      new ApiError(500, "Lỗi khi thêm dịch vụ vận chuyển cho đặt phòng")
    );
  }
};

exports.addServiceForTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { services } = req.body;

    const booking = await Booking.findById(bookingId).populate(
      "rooms.desiredRoomTypeId"
    );
    const existingServices = await Service.find();
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    const totalNights =
      booking.rooms && booking.rooms[0]
        ? (new Date(booking.rooms[0].expectedCheckOutDate) -
            new Date(booking.rooms[0].expectedCheckInDate)) /
          (1000 * 60 * 60 * 24)
        : 0;

    booking.rooms.forEach((room, index) => {
      const roomServices = services[index] || {};
      console.log("Room services:", roomServices);

      // Extract the service array from the roomServices object
      const serviceArray = roomServices.service || [];

      room.additionalServices = serviceArray.map((service) => {
        const existingService = existingServices.find(
          (s) => s._id.toString() === service.serviceId.toString()
        );

        let calculatedPrice;
        switch (existingService?.category) {
          case "per_unit":
            calculatedPrice = existingService.price * (service.quantity || 1);
            break;
          case "per_duration":
            calculatedPrice = existingService.price * totalNights;
            break;
          case "per_person":
            calculatedPrice =
              existingService.price *
              (room.numberOfAdults + room.numberOfChildren);
            break;
          case "fixed":
            calculatedPrice = existingService.price;
            break;
          default:
            calculatedPrice = existingService?.price || 0;
        }

        return {
          serviceId: service.serviceId,
          quantity: service.quantity || 1,
          price: calculatedPrice,
        };
      });
    });

    // Use findByIdAndUpdate to avoid validation issues with required fields
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { rooms: booking.rooms },
      { new: true, runValidators: false }
    ).populate("rooms.desiredRoomTypeId");

    // Create inventory slips for minibar services
    try {
      for (let roomIndex = 0; roomIndex < booking.rooms.length; roomIndex++) {
        const room = booking.rooms[roomIndex];
        const roomId = room.roomid;

        if (!roomId || !room.additionalServices) continue;

        for (const svc of room.additionalServices) {
          const serviceData = await Service.findById(svc.serviceId).populate(
            "inventoryItemId"
          );

          if (
            serviceData &&
            serviceData.category === "minibar" &&
            serviceData.inventoryItemId &&
            serviceData.inventoryItemId.length > 0
          ) {
            const quantity = svc.quantity || 1;

            // Prepare items for inventory slip
            const items = [];
            for (const invId of serviceData.inventoryItemId) {
              const inventoryItem = await Inventory.findById(invId);

              if (inventoryItem) {
                items.push({
                  inventoryId: invId,
                  quantity: quantity,
                  inventoryType: inventoryItem.type,
                  condition: "USED",
                });

                // Update inventory quantity (subtract)
                inventoryItem.quantity = Math.max(
                  0,
                  inventoryItem.quantity - quantity
                );
                await inventoryItem.save();
              }
            }

            if (items.length > 0) {
              // Get staff ID - use first staff or booking creator
              const staffId =
                req.body.staffId || booking.createdBy || booking.customerid;

              if (staffId) {
                const inventorySlip = await InventorySlip.create({
                  roomId: roomId,
                  staffId: staffId,
                  type: "MINIBAR",
                  items: items,
                  note: `Sử dụng minibar: ${serviceData.name} (booking ${booking.bookingCode || booking._id})`,
                });

                console.log(
                  `Created inventory slip ${inventorySlip._id} for minibar service ${serviceData.name}`
                );
              }
            }
          }
        }
      }
    } catch (invError) {
      console.error(
        "Error creating minibar inventory slips in addServiceForTemporaryBooking:",
        invError
      );
      // Don't fail if inventory slip creation fails
    }

    return res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.log("Error adding service for temporary booking:", error);
    return next(
      new ApiError(500, "Lỗi khi thêm dịch vụ cho đặt phòng tạm thời")
    );
  }
};

exports.addServiceToTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { services } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    const existingServices = await Service.find({
      _id: { $in: services.map((s) => s.serviceId) },
    });

    const bookingServices = services.map((service) => {
      const existingService = existingServices.find(
        (s) => s._id.toString() === service.serviceId.toString()
      );

      let price = 0;
      if (existingService.unit === "per_unit") {
        price = existingService.price * (service.quantity || 1);
      } else if (existingService.unit === "fixed") {
        price = existingService.price;
      }

      return {
        serviceId: service.serviceId,
        quantity: service.quantity || 1,
        price,
      };
    });

    booking.services = bookingServices;

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { services: bookingServices },
      { new: true }
    ).populate("services.serviceId");

    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Lỗi khi thêm dịch vụ"));
  }
};

exports.ConfirmTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { customerId, method } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate("services.serviceId");

    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    const totalPrice = calculateBookingTotalPrice(booking);
    booking.status = method === "vnpay" ? "pending" : "booked";
    booking.totalPrice = totalPrice;
    booking.customerid = customerId;

    await booking.populate("customerid");

    console.log("customer booking: ", booking);
    console.log("customerid: ", booking.customerid);

    if (booking.customerid) {
      const customerSnapshot = {
        honorific: booking.customerid.honorific,
        firstName: booking.customerid.firstName,
        lastName: booking.customerid.lastName,
        email: booking.customerid.email,
        phoneNumber: booking.customerid.phoneNumber,
        identificationNumber: booking.customerid.identificationNumber,
      };
      booking.customerSnapshot = customerSnapshot;

      // Set mainGuest info for the first room from customer info
      if (booking.rooms && booking.rooms.length > 0) {
        booking.rooms[0].mainGuest = {
          firstName: booking.customerid.firstName,
          lastName: booking.customerid.lastName,
          honorific: booking.customerid.honorific,
          gender:
            booking.customerid.honorific === "Ông"
              ? "male"
              : booking.customerid.honorific === "Bà"
                ? "female"
                : "",
          phoneNumber: booking.customerid.phoneNumber,
          dateOfBirth: booking.customerid.dateOfBirth,
          identificationNumber: booking.customerid.identificationNumber,
          nationality: booking.customerid.nationality,
        };
      }
    }

    await booking.save();

    // Return the populated booking from the earlier findByIdAndUpdate
    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.log("Error adding customer to temporary booking:", error);
    next(new ApiError(500, "Lỗi khi thêm khách hàng vào đặt phòng tạm thời"));
  }
};

exports.saveBookingServices = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { services } = req.body;

    console.log("Room services data received:", services);

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    if (booking.status === "completed" || booking.status === "cancelled") {
      return next(
        new ApiError(400, "Không thể cập nhật dịch vụ cho đặt phòng này")
      );
    }

    booking.rooms.forEach((room, index) => {
      const roomServices = services[index] || [];

      // Map the service array to the correct format
      room.additionalServices = roomServices.map((service) => ({
        serviceId: service._id || service.serviceId,
        quantity: service.quantity || 1,
        price: service.price || 0,
      }));
    });

    console.log(
      "Updated room services:",
      booking.rooms.map((r) => r.additionalServices)
    );

    await booking.save();

    // Fetch the updated booking with populated data
    const updatedBooking = await Booking.findById(bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate({
        path: "rooms.additionalServices.serviceId",
        model: "Service",
      })
      .populate({
        path: "services.serviceId",
        model: "Service",
      });

    // Recalculate total price and update payment status
    const totalPrice = calculateBookingTotalPrice(updatedBooking);
    updatedBooking.totalPrice = totalPrice;
    await updatedBooking.save();
    await updateBookingPaymentStatus(updatedBooking._id);

    // Create inventory slips for minibar services
    try {
      for (
        let roomIndex = 0;
        roomIndex < updatedBooking.rooms.length;
        roomIndex++
      ) {
        const room = updatedBooking.rooms[roomIndex];
        const roomId = room.roomid?._id || room.roomid;

        if (!roomId || !room.additionalServices) continue;

        for (const svc of room.additionalServices) {
          const serviceData = await Service.findById(svc.serviceId).populate(
            "inventoryItemId"
          );

          if (
            serviceData &&
            serviceData.category === "minibar" &&
            serviceData.inventoryItemId &&
            serviceData.inventoryItemId.length > 0
          ) {
            const quantity = svc.quantity || 1;

            // Check if inventory slip already exists for this service
            const existingSlip = await InventorySlip.findOne({
              roomId: roomId,
              type: "MINIBAR",
              note: {
                $regex: `${serviceData.name}.*booking ${updatedBooking.bookingCode || updatedBooking._id}`,
              },
            });

            if (existingSlip) {
              console.log(
                `Inventory slip already exists for ${serviceData.name} in room ${roomId}`
              );
              continue;
            }

            // Prepare items for inventory slip
            const items = [];
            for (const invId of serviceData.inventoryItemId) {
              const inventoryItem = await Inventory.findById(invId);

              if (inventoryItem) {
                items.push({
                  inventoryId: invId,
                  quantity: quantity,
                  inventoryType: inventoryItem.type,
                  condition: "USED",
                });

                // Update inventory quantity (subtract)
                inventoryItem.quantity = Math.max(
                  0,
                  inventoryItem.quantity - quantity
                );
                await inventoryItem.save();
              }
            }

            if (items.length > 0) {
              // Get staff ID - use first staff or booking creator
              const staffId =
                req.body.staffId ||
                updatedBooking.createdBy ||
                updatedBooking.customerid;

              if (staffId) {
                const inventorySlip = await InventorySlip.create({
                  roomId: roomId,
                  staffId: staffId,
                  type: "MINIBAR",
                  items: items,
                  note: `Sử dụng minibar: ${serviceData.name} (booking ${updatedBooking.bookingCode || updatedBooking._id})`,
                });

                console.log(
                  `Created inventory slip ${inventorySlip._id} for minibar service ${serviceData.name}`
                );
              }
            }
          }
        }
      }
    } catch (invError) {
      console.error(
        "Error creating minibar inventory slips in saveBookingServices:",
        invError
      );
      // Don't fail if inventory slip creation fails
    }

    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Error saving booking services:", error);
    next(new ApiError(500, "Lỗi khi lưu dịch vụ đặt phòng"));
  }
};

exports.getPaymentBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate({
        path: "rooms.additionalServices.serviceId",
        model: "Service",
      })
      .populate({
        path: "services.serviceId",
        model: "Service",
      });
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    booking.rooms.sort((a, b) => {
      const numA = a.roomid?.roomNumber || "";
      const numB = b.roomid?.roomNumber || "";
      return numA.localeCompare(numB, "vi", { numeric: true });
    });

    const total = booking.rooms.reduce((sum, room) => {
      let nights = 0;

      if (room.actualCheckInDate && room.actualCheckOutDate) {
        const checkInDate = new Date(room.actualCheckInDate);
        const checkOutDate = new Date(room.actualCheckOutDate);
        const timeDiffMs = checkOutDate.getTime() - checkInDate.getTime();

        // Calculate nights - if less than 1 day, round up to 1
        nights = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)));

        // For completed bookings, ensure minimum 1 night charge regardless
        if (booking.status === "completed") {
          nights = Math.max(nights, 1);
        }
      } else if (room.expectedCheckInDate && room.expectedCheckOutDate) {
        const checkInDate = new Date(room.expectedCheckInDate);
        const checkOutDate = new Date(room.expectedCheckOutDate);
        const timeDiffMs = checkOutDate.getTime() - checkInDate.getTime();

        nights = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)));
      } else {
        nights = 1; // Default to 1 night if no dates found
      }

      const roomPrice = room.pricePerNight * nights;

      // Calculate service prices including per_duration adjustment
      const servicePrice = room.additionalServices.reduce(
        (serviceSum, service) => {
          return serviceSum + (service.price || 0) * (service.quantity || 1);
        },
        0
      );

      return sum + roomPrice + servicePrice;
    }, 0);

    // Add booking-level services (transportation) to total
    const bookingServicesTotal = (booking.services || []).reduce(
      (sum, service) => {
        return sum + (service.price || 0) * (service.quantity || 1);
      },
      0
    );

    const finalTotal = total + bookingServicesTotal;
    console.log(
      "Room total:",
      total,
      "Services total:",
      bookingServicesTotal,
      "Final total:",
      finalTotal
    );

    // Use findByIdAndUpdate to avoid validation issues
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { totalPrice: finalTotal },
      { new: true, runValidators: false }
    )
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate({
        path: "rooms.additionalServices.serviceId",
        model: "Service",
      })
      .populate({
        path: "services.serviceId",
        model: "Service",
      });

    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.log("Error fetching booking for payment:", error);
    next(new ApiError(500, "Lỗi khi lấy thông tin đặt phòng cho thanh toán"));
  }
};

exports.paymentBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { moneyReceived } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId");
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    booking.rooms.sort((a, b) => {
      const numA = a.roomid?.roomNumber || "";
      const numB = b.roomid?.roomNumber || "";
      return numA.localeCompare(numB, "vi", { numeric: true });
    });

    const newMoneyReceived =
      Number(booking.moneyReceived || 0) + Number(moneyReceived);
    const change = newMoneyReceived - booking.totalPrice;
    const paymentStatus = change < 0 ? "partially_paid" : "paid";

    // Use findByIdAndUpdate to avoid validation issues
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        moneyReceived: newMoneyReceived,
        change: change > 0 ? change : 0,
        paymentStatus: paymentStatus,
      },
      { new: true, runValidators: false }
    )
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId");

    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.log("Error processing payment:", error);
    next(new ApiError(500, "Lỗi khi xử lý thanh toán"));
  }
};

exports.getBookingByRoomId = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const booking = await Booking.findOne({
      "rooms.roomid": roomId,
      status: "checked_in",
    });
    if (!booking) {
      await Room.findByIdAndUpdate(roomId, { status: "available" });
      return next(new ApiError(404, "Không tìm thấy đặt phòng cho phòng này"));
    }
    res.status(200).json({ success: true, bookingId: booking._id });
  } catch (error) {
    next(new ApiError(500, "Lỗi khi lấy thông tin đặt phòng"));
  }
};

exports.resetRoomInTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          services: [],
          "rooms.$[].desiredRoomTypeId": null,
          "rooms.$[].additionalServices": [],
        },
      },
      { new: true }
    );

    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("Error resetting room type:", error);
    next(new ApiError(500, "Lỗi khi đặt lại phòng trong đặt phòng tạm thời"));
  }
};

exports.resetDateInTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          expectedCheckInDate: null,
          expectedCheckOutDate: null,
          services: [],
          "rooms.$[].desiredRoomTypeId": null,
          "rooms.$[].additionalServices": [],
          "rooms.$[].expectedCheckInDate": null,
          "rooms.$[].expectedCheckOutDate": null,
        },
      },
      { new: true, runValidators: false }
    )
      .populate("rooms.desiredRoomTypeId")
      .populate("services.serviceId");

    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("Error resetting dates:", error);
    next(new ApiError(500, "Lỗi khi đặt lại ngày trong đặt phòng tạm thời"));
  }
};

exports.completeTemporaryBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("rooms.desiredRoomTypeId")
      .populate("services.serviceId");

    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    const totalNights =
      (new Date(booking.expectedCheckOutDate) -
        new Date(booking.expectedCheckInDate)) /
      (1000 * 60 * 60 * 24);

    if (totalNights <= 0) {
      return next(new ApiError(400, "Ngày check-out không hợp lệ"));
    }

    const totalRoomPrice = booking.rooms.reduce((sum, room) => {
      return sum + room.pricePerNight * totalNights;
    }, 0);

    const totalServicePrice = (booking.services || []).reduce(
      (sum, service) => sum + (service.price || 0) * (service.quantity || 1),
      0
    );

    booking.totalPrice = totalRoomPrice + totalServicePrice;
    booking.status = "booked";

    await booking.save();

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Error completing booking:", error);
    next(new ApiError(500, "Lỗi khi hoàn thành booking"));
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingData = await Booking.findById(bookingId).populate("roomid");
    if (!bookingData) {
      return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    }
    if (
      bookingData.status === "completed" ||
      bookingData.status === "cancelled"
    ) {
      return next(new ApiError(400, "Không thể huỷ đặt phòng này"));
    }
    bookingData.status = "cancelled";
    bookingData.actualCheckOutDate = new Date();

    await bookingData.save();

    if (bookingData.roomid) {
      await Room.findByIdAndUpdate(bookingData.roomid._id, {
        status: "available",
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Huỷ đặt phòng thành công" });
  } catch (error) {
    next(new ApiError(500, "Lỗi khi huỷ đặt phòng"));
  }
};

exports.saveTransportationServices = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { services } = req.body;

    console.log("Transportation services data received:", services);

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new ApiError(404, "Không tìm thấy đặt phòng"));

    if (booking.status === "completed" || booking.status === "cancelled") {
      return next(
        new ApiError(400, "Không thể cập nhật dịch vụ cho đặt phòng này")
      );
    }

    // Update transportation services (forEachRoom = false)
    booking.services = (services || []).map((service) => ({
      serviceId: service._id || service.serviceId,
      quantity: service.quantity || 1,
      price: service.price || 0,
    }));

    console.log("Mapped services:", booking.services);

    await booking.save();

    // Fetch the updated booking with populated data
    const updatedBooking = await Booking.findById(bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate({
        path: "rooms.additionalServices.serviceId",
        model: "Service",
      })
      .populate({
        path: "services.serviceId",
        model: "Service",
      });

    // Recalculate total price and update payment status
    const totalPrice = calculateBookingTotalPrice(updatedBooking);
    updatedBooking.totalPrice = totalPrice;
    await updatedBooking.save();
    await updateBookingPaymentStatus(updatedBooking._id);

    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Error saving transportation services:", error);
    next(new ApiError(500, "Lỗi khi lưu dịch vụ vận chuyển"));
  }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const bookingData = await Booking.findByIdAndDelete(bookingId);
    if (!bookingData) {
      return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    }

    res
      .status(200)
      .json({ success: true, message: "Xoá đặt phòng thành công" });
  } catch (error) {
    next(new ApiError(500, "Lỗi khi xoá đặt phòng"));
  }
};

const generateVNPhoneVariants = (phone) => {
  const variants = new Set();
  const cleaned = phone.replace(/\D/g, ""); // bỏ +, space, -

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    variants.add(cleaned); // 0912312312
    variants.add("84" + cleaned.slice(1)); // 84912312312
    variants.add("+84" + cleaned.slice(1)); // +84912312312
  }

  if (cleaned.startsWith("84") && cleaned.length === 11) {
    variants.add(cleaned); // 84912312312
    variants.add("0" + cleaned.slice(2)); // 0912312312
    variants.add("+" + cleaned); // +84912312312
  }

  return [...variants];
};

exports.lookupBooking = async (req, res, next) => {
  try {
    const { bookingCode, phoneNumber } = req.query;

    if (!bookingCode || !phoneNumber) {
      return next(
        new ApiError(400, "Vui lòng cung cấp mã đặt phòng và số điện thoại")
      );
    }

    const phoneVariants = generateVNPhoneVariants(phoneNumber);

    const booking = await Booking.findOne({
      bookingCode: bookingCode.trim(),
      "customerSnapshot.phoneNumber": { $in: phoneVariants },
    })
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate({
        path: "rooms.additionalServices.serviceId",
        model: "Service",
      })
      .populate({
        path: "services.serviceId",
        model: "Service",
      });

    if (!booking) {
      return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error looking up booking:", error);
    next(new ApiError(500, "Lỗi khi tra cứu đặt phòng"));
  }
};

// Request cancellation for a booking
exports.requestCancellation = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    }

    // Only allow cancellation request for booked status
    if (booking.status !== "booked") {
      return next(
        new ApiError(
          400,
          "Chỉ có thể yêu cầu hủy đặt phòng đang ở trạng thái 'Đã đặt'"
        )
      );
    }

    // Add a note to internal notes about cancellation request
    const cancellationNote = `\n[${new Date().toLocaleString("vi-VN")}] Khách hàng yêu cầu hủy đặt phòng`;
    booking.internalNotes = (booking.internalNotes || "") + cancellationNote;
    await booking.save();

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error requesting cancellation:", error);
    next(new ApiError(500, "Lỗi khi gửi yêu cầu hủy"));
  }
};

// Cleanup expired pending bookings (older than 30 minutes)
exports.cleanupExpiredPendingBookings = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find all pending bookings created more than 30 minutes ago
    const expiredBookings = await Booking.find({
      status: "pending",
      createdAt: { $lt: thirtyMinutesAgo },
    });

    if (expiredBookings.length > 0) {
      // Delete expired bookings
      const result = await Booking.deleteMany({
        status: "pending",
        createdAt: { $lt: thirtyMinutesAgo },
      });

      console.log(
        `[Cleanup] Deleted ${result.deletedCount} expired pending bookings`
      );
      console.log(
        `[Cleanup] Booking codes deleted: ${expiredBookings
          .map((b) => b.bookingCode)
          .join(", ")}`
      );

      return result.deletedCount;
    } else {
      console.log("[Cleanup] No expired pending bookings found");
      return 0;
    }
  } catch (error) {
    console.error("[Cleanup] Error cleaning up expired bookings:", error);
    return 0;
  }
};
