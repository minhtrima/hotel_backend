const Inventory = require("../models/inventory");

/**
 * @desc    Create inventory item
 * @route   POST /api/inventories
 */
exports.createInventory = async (req, res) => {
  try {
    const inventory = await Inventory.create(req.body);
    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all inventories
 * @route   GET /api/inventories
 */
exports.getInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find({ isActive: true }).sort({
      name: 1,
    });
    res.json(inventories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get single inventory
 * @route   GET /api/inventories/:id
 */
exports.getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "Không tìm thấy vật tư" });
    }
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update inventory
 * @route   PUT /api/inventories/:id
 */
exports.updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ message: "Không tìm thấy vật tư" });
    }

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Adjust inventory quantity (issue / return)
 * @route   PATCH /api/inventories/:id/quantity
 */
exports.adjustQuantity = async (req, res) => {
  try {
    const { amount } = req.body; // + hoặc -
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: "Không tìm thấy vật tư" });
    }

    inventory.quantity += amount;
    if (inventory.quantity < 0) inventory.quantity = 0;

    await inventory.save();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Soft delete inventory
 * @route   DELETE /api/inventories/:id
 */
exports.deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ message: "Không tìm thấy vật tư" });
    }

    res.json({ message: "Đã vô hiệu hóa vật tư" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get minibar inventory items
 * @route   GET /api/inventories/minibar/available
 */
exports.getAvailableMinibarInventories = async (req, res) => {
  try {
    // Get all MINIBAR inventory items (no filtering, allow multiple services to use same inventory)
    const minibarInventories = await Inventory.find({
      category: "MINIBAR",
      isActive: true,
    }).sort({ name: 1 });

    res.json(minibarInventories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
