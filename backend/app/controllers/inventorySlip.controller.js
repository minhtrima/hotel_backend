const InventorySlip = require("../models/inventorySlip");
const Inventory = require("../models/inventory");
const Service = require("../models/service");
const Booking = require("../models/booking");
const mongoose = require("mongoose");

exports.createSlip = async (req, res) => {
  try {
    const { roomId, taskId, staffId, items, note, type } = req.body;
    console.log("Creating slip with data:", req.body);
    // Validation
    if (!staffId || !items || items.length === 0) {
      throw new Error("Thiếu dữ liệu bắt buộc: staffId và ít nhất 1 vật tư");
    }

    if (!type) {
      throw new Error("Thiếu loại phiếu");
    }

    const enrichedItems = [];
    const consumableItems = []; // Vật tư tiêu hao cần trừ kho
    const reusableItems = []; // Vật tư tái sử dụng không trừ kho

    for (const item of items) {
      const inventory = await Inventory.findById(item.inventoryId);

      if (!inventory) {
        throw new Error(`Vật tư không tồn tại: ${item.inventoryId}`);
      }

      const itemCondition = item.condition || "GOOD";
      const isConsumable = inventory.type === "CONSUMABLE";
      const isReusable = inventory.type === "REUSABLE";

      // Kiểm tra condition cho vật tư tái sử dụng
      const isGoodOrDirtyReusable =
        isReusable && (itemCondition === "GOOD" || itemCondition === "DIRTY");
      const isDamagedOrLostReusable =
        isReusable && (itemCondition === "DAMAGED" || itemCondition === "LOST");

      // Logic xử lý
      if (isConsumable) {
        // Kiểm tra tồn kho cho vật tư tiêu hao
        if (inventory.quantity < item.quantity) {
          throw new Error(
            `Không đủ tồn kho cho ${inventory.name} (tiêu hao). Còn lại: ${inventory.quantity} ${inventory.unit}`
          );
        }
        consumableItems.push({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          name: inventory.name,
        });
      } else if (isDamagedOrLostReusable) {
        // Vật tư tái sử dụng bị hư/mất - trừ kho
        if (inventory.quantity < item.quantity) {
          throw new Error(
            `Không đủ tồn kho cho ${inventory.name} (hư/mất). Còn lại: ${inventory.quantity} ${inventory.unit}`
          );
        }
        consumableItems.push({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          name: inventory.name,
          reason: `Condition: ${itemCondition}`,
        });
      } else if (isGoodOrDirtyReusable) {
        // Vật tư tái sử dụng còn tốt/bẩn - không trừ kho
        reusableItems.push({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          name: inventory.name,
          condition: itemCondition,
        });
      }

      // Thêm vào enrichedItems
      enrichedItems.push({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        inventoryType: inventory.type,
        condition: itemCondition,
        deductedFromStock: isConsumable || isDamagedOrLostReusable,
      });
    }

    // Trừ kho cho vật tư tiêu hao và vật tư tái sử dụng bị hư/mất
    for (const item of consumableItems) {
      await Inventory.findByIdAndUpdate(item.inventoryId, {
        $inc: { quantity: -item.quantity },
      });
    }

    // Tạo phiếu
    const slip = await InventorySlip.create({
      roomId: roomId || undefined,
      taskId: taskId || undefined,
      staffId,
      items: enrichedItems,
      type,
      note: note || "",
      status: "COMPLETED",
    });

    // Nếu type là MINIBAR, tìm service và thêm vào booking
    if (type === "MINIBAR" && roomId) {
      try {
        // Lấy inventoryIds từ items
        const inventoryIds = enrichedItems.map((item) => item.inventoryId);

        // Tìm service có inventoryItemId chứa một trong các inventory này
        for (const invId of inventoryIds) {
          const service = await Service.findOne({
            category: "minibar",
            inventoryItemId: invId,
          });

          if (service) {
            // Tìm booking active cho room này
            const booking = await Booking.findOne({
              "rooms.roomid": roomId,
              status: { $in: ["confirmed", "checked_in"] },
            });

            if (booking) {
              // Tìm room trong booking
              const roomIndex = booking.rooms.findIndex(
                (r) =>
                  (typeof r.roomid === "object" && r.roomid !== null
                    ? r.roomid._id?.toString() || r.roomid.toString()
                    : r.roomid?.toString()) === roomId.toString()
              );

              if (roomIndex !== -1) {
                // Lấy quantity từ item tương ứng
                const itemQuantity =
                  enrichedItems.find(
                    (item) => item.inventoryId.toString() === invId.toString()
                  )?.quantity || 1;

                // Tính giá dựa trên category của service
                const room = booking.rooms[roomIndex];
                const totalNights = Math.ceil(
                  (new Date(booking.checkOutDate) -
                    new Date(booking.checkInDate)) /
                    (1000 * 60 * 60 * 24)
                );

                let calculatedPrice;
                switch (service.category) {
                  case "per_unit":
                    calculatedPrice = service.price * itemQuantity;
                    break;
                  case "per_duration":
                    calculatedPrice = service.price * totalNights;
                    break;
                  case "per_person":
                    calculatedPrice =
                      service.price *
                      (room.numberOfAdults + room.numberOfChildren);
                    break;
                  case "fixed":
                    calculatedPrice = service.price;
                    break;
                  default:
                    calculatedPrice = service.price || 0;
                }

                // Kiểm tra service đã tồn tại chưa
                const existingServiceIndex = booking.rooms[
                  roomIndex
                ].additionalServices?.findIndex(
                  (s) => s.serviceId.toString() === service._id.toString()
                );

                if (existingServiceIndex !== -1) {
                  // Tăng quantity nếu đã tồn tại
                  booking.rooms[roomIndex].additionalServices[
                    existingServiceIndex
                  ].quantity += itemQuantity;
                  // Cập nhật lại price với quantity mới
                  const newQuantity =
                    booking.rooms[roomIndex].additionalServices[
                      existingServiceIndex
                    ].quantity;
                  if (service.category === "per_unit") {
                    booking.rooms[roomIndex].additionalServices[
                      existingServiceIndex
                    ].price = service.price * newQuantity;
                  }
                } else {
                  // Thêm service mới
                  if (!booking.rooms[roomIndex].additionalServices) {
                    booking.rooms[roomIndex].additionalServices = [];
                  }
                  booking.rooms[roomIndex].additionalServices.push({
                    serviceId: service._id,
                    quantity: itemQuantity,
                    price: calculatedPrice,
                  });
                }

                await booking.save();
                console.log(
                  `Added minibar service ${service.name} to booking ${booking._id} for room ${roomId}`
                );
              }
            }
          }
        }
      } catch (serviceError) {
        console.error("Error adding minibar service to booking:", serviceError);
        // Không fail tạo slip nếu thêm service thất bại
      }
    }

    // Tạo response message chi tiết
    let message = "Đã tạo phiếu thành công. ";
    if (consumableItems.length > 0) {
      message += `Đã trừ kho ${consumableItems.length} vật tư: `;
      message += consumableItems
        .map((item) => `${item.name} (${item.quantity})`)
        .join(", ");
    }
    if (reusableItems.length > 0) {
      message += ` ${reusableItems.length} vật tư tái sử dụng không bị trừ kho.`;
    }

    res.status(201).json({
      success: true,
      data: slip,
      message: message.trim(),
      stats: {
        totalItems: items.length,
        consumableDeducted: consumableItems.length,
        reusableNotDeducted: reusableItems.length,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.cancelSlip = async (req, res) => {
  try {
    const slip = await InventorySlip.findById(req.params.id);
    if (!slip) throw new Error("Phiếu không tồn tại");

    if (slip.status === "CANCELLED") {
      throw new Error("Phiếu đã bị hủy");
    }

    // 1️⃣ Hoàn kho
    for (const item of slip.items) {
      await Inventory.findByIdAndUpdate(item.inventoryId, {
        $inc: { quantity: item.quantity },
      });
    }

    const deleteResult = await InventorySlip.deleteOne({ _id: req.params.id });
    if (deleteResult.deletedCount === 0) {
      throw new Error("Không thể hủy phiếu");
    }

    res.json({
      success: true,
      message: "Đã hủy phiếu và hoàn kho",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getSlips = async (req, res) => {
  const { roomId, taskId, _id, staffId, type } = req.query;
  console.log("Get slips with filters:", req.query);
  const filter = {};
  if (_id) filter._id = _id;
  if (roomId) filter.roomId = roomId;
  if (taskId) filter.taskId = taskId;
  if (staffId) filter.staffId = staffId;
  if (type) filter.type = type;
  console.log(filter);

  const slips = await InventorySlip.find(filter)
    .populate("roomId", "roomNumber floor")
    .populate("staffId", "name position")
    .populate("items.inventoryId", "name unit category type quantity")
    .populate("taskId", "title description")
    .sort({ createdAt: -1 });

  console.log("Retrieved slips:", slips);

  res.json({
    success: true,
    data: slips,
  });
};

exports.getSlipStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await InventorySlip.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: "CANCELLED" },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.inventoryId",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "inventories",
          localField: "_id",
          foreignField: "_id",
          as: "inventory",
        },
      },
      {
        $unwind: "$inventory",
      },
      {
        $project: {
          inventoryName: "$inventory.name",
          category: "$inventory.category",
          unit: "$inventory.unit",
          totalQuantity: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
