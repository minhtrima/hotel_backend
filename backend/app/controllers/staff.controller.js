const Staff = require("../models/staff");
const { uploadSingleImage } = require("../utils/cloudinaryUpload");
const ApiError = require("../utils/api-error");

exports.createStaff = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      address,
      identificationNumber,
      dateOfBirth,
      position = position,
      shift = shift,
      salary = salary,
      ...rest
    } = req.body;

    if (!name) return next(new ApiError(400, "Name is required"));
    if (!email) return next(new ApiError(400, "Email is required"));
    if (!phoneNumber || phoneNumber.length < 10)
      return next(new ApiError(400, "Phone number is required"));
    if (!address) return next(new ApiError(400, "Address is required"));
    if (!identificationNumber)
      return next(new ApiError(400, "Identification number is required"));
    if (!dateOfBirth)
      return next(new ApiError(400, "Date of birth is required"));

    const staff = new Staff({
      name,
      email,
      phoneNumber,
      address,
      identificationNumber,
      dateOfBirth,
      position,
      shift,
      salary,
      ...rest,
    });

    await staff.save();

    res.status(201).json({ success: true, staff });
  } catch (error) {
    next(new ApiError(400, error.message));
  }
};

exports.getHousekeepingStaff = async (req, res, next) => {
  try {
    // Lọc nhân viên theo position housekeeping để phân công công việc từ frontend
    const housekeepingStaff = await Staff.find({
      position: {
        $in: ["housekeeping", "Housekeeping", "dọn phòng", "Dọn phòng"],
      },
    });
    res.status(200).json({ success: true, staff: housekeepingStaff });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

exports.getAllStaff = async (req, res, next) => {
  try {
    const staff = await Staff.find();
    res.status(200).json({ success: true, staff });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

exports.getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return next(new ApiError(404, "Staff not found"));
    }
    res.status(200).json({ success: true, staff });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    if (!req.body.phoneNumber || req.body.phoneNumber.length < 10) {
      return next(new ApiError(400, "Phone number is required"));
    }
    if (!req.body.address) {
      return next(new ApiError(400, "Address is required"));
    }
    if (!req.body.name) {
      return next(new ApiError(400, "Name is required"));
    }
    if (!req.body.email) {
      return next(new ApiError(400, "Email is required"));
    }
    if (!req.body.identificationNumber) {
      return next(new ApiError(400, "Identification number is required"));
    }
    if (!req.body.dateOfBirth) {
      return next(new ApiError(400, "Date of birth is required"));
    }

    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!staff) {
      return next(new ApiError(404, "Staff not found"));
    }
    res.status(200).json({ success: true, staff });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return next(new ApiError(404, "Staff not found"));
    }
    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

exports.changeAvatar = async (req, res, next) => {
  try {
    const staffId = req.params.id;
    const { imageBase64 } = req.body;

    console.log("Change avatar request for staff:", staffId);
    console.log("Image data received:", imageBase64 ? "Yes" : "No");

    // Kiểm tra staff tồn tại
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return next(new ApiError(404, "Không tìm thấy nhân viên"));
    }

    // Kiểm tra có dữ liệu ảnh không
    if (!imageBase64) {
      return next(new ApiError(400, "Vui lòng chọn ảnh đại diện"));
    }

    console.log("Uploading to Cloudinary...");
    // Upload ảnh base64 lên Cloudinary
    const result = await uploadSingleImage(imageBase64, {
      folder: "staff_avatars",
    });

    console.log("Upload result:", result ? "Success" : "Failed");

    if (!result || !result.secure_url) {
      return next(new ApiError(500, "Không thể tải ảnh lên Cloudinary"));
    }

    // Cập nhật avatar cho staff
    staff.avatar = result.secure_url;
    await staff.save();

    console.log("Staff avatar updated:", result.secure_url);

    // Cập nhật avatar cho user tương ứng
    const User = require("../models/user");
    const user = await User.findOne({ staffId: staffId });
    if (user) {
      user.avatar = result.secure_url;
      await user.save();
      console.log("User avatar updated");
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật ảnh đại diện thành công",
      avatar: result.secure_url,
    });
  } catch (error) {
    console.error("Change avatar error:", error);
    return next(
      new ApiError(500, "Lỗi khi thay đổi ảnh đại diện: " + error.message)
    );
  }
};
