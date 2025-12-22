const User = require("../models/user");
const Staff = require("../models/staff");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendActivationEmail } = require("../utils/emailService");
const ApiError = require("../utils/api-error");

// Check account status for staff
exports.checkAccountStatus = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return next(new ApiError(404, "Không tìm thấy nhân viên"));
    }

    // Check if user account exists with this staffId
    const user = await User.findOne({ staffId });

    let status;
    if (!user) {
      // No user account exists for this staff
      status = "no_account";
    } else if (user.isActive === false) {
      // User exists but not activated
      status =
        user.activationToken && user.activationExpires > Date.now()
          ? "pending"
          : "inactive";
    } else {
      // User exists and is active
      status = "active";
    }

    return res.status(200).json({
      success: true,
      status,
      user: user
        ? {
            id: user._id,
            email: user.email,
            name: user.name,
            isActive: user.isActive,
            hasActivationToken: !!user.activationToken,
          }
        : null,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
      },
    });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Lỗi kiểm tra trạng thái tài khoản"));
  }
};

// Check if staff has user account
exports.checkStaffAccount = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return next(new ApiError(404, "Không tìm thấy nhân viên"));
    }

    const user = await User.findOne({ staffId });

    return res.status(200).json({
      success: true,
      hasAccount: !!user,
      accountActive: user ? user.isActive : false,
      staffInfo: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
      },
    });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Lỗi kiểm tra tài khoản"));
  }
};

// Create user account for staff
exports.createStaffAccount = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return next(new ApiError(404, "Không tìm thấy nhân viên"));
    }

    // Check if account already exists and is active
    const existingUser = await User.findOne({ staffId });
    if (existingUser && existingUser.isActive) {
      return next(new ApiError(400, "Tài khoản đã tồn tại và đang hoạt động"));
    }

    // Check if email is already used by another active account
    const emailUser = await User.findOne({
      email: staff.email,
      isActive: true,
      staffId: { $ne: staffId },
    });
    if (emailUser) {
      return next(
        new ApiError(400, "Email đã được sử dụng cho tài khoản khác")
      );
    }

    // If inactive user exists, remove it first
    if (existingUser && !existingUser.isActive) {
      await User.findByIdAndDelete(existingUser._id);
    }

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user account
    const newUser = new User({
      email: staff.email,
      name: staff.name,
      password: hashedPassword,
      role: "staff",
      staffId: staffId,
      avatar: staff.avatar,
      isActive: false,
      activationToken,
      activationExpires,
      needsPasswordChange: true,
    });

    await newUser.save();

    // Send activation email
    const emailResult = await sendActivationEmail(
      staff.email,
      staff.name,
      activationToken
    );

    if (!emailResult.success) {
      // If email fails, delete the created user
      await User.findByIdAndDelete(newUser._id);
      return next(new ApiError(500, "Không thể gửi email kích hoạt"));
    }

    return res.status(201).json({
      success: true,
      message: "Tài khoản đã được tạo. Email kích hoạt đã được gửi.",
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Lỗi tạo tài khoản"));
  }
};

// Restore staff account (deactivate and send new activation)
exports.restoreStaffAccount = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return next(new ApiError(404, "Không tìm thấy nhân viên"));
    }

    const user = await User.findOne({ staffId });
    if (!user) {
      return next(new ApiError(404, "Không tìm thấy tài khoản"));
    }

    // Generate new activation token
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user - deactivate and set new activation token
    user.isActive = false;
    user.activationToken = activationToken;
    user.activationExpires = activationExpires;
    user.needsPasswordChange = true;

    await user.save();

    // Send activation email
    const emailResult = await sendActivationEmail(
      staff.email,
      staff.name,
      activationToken
    );

    if (!emailResult.success) {
      return next(new ApiError(500, "Không thể gửi email kích hoạt"));
    }

    return res.status(200).json({
      success: true,
      message: "Email khôi phục tài khoản đã được gửi.",
    });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Lỗi khôi phục tài khoản"));
  }
};

// Activate account with token
exports.activateAccount = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      activationToken: token,
      activationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ApiError(400, "Token kích hoạt không hợp lệ hoặc đã hết hạn")
      );
    }

    return res.status(200).json({
      success: true,
      message: "Token hợp lệ",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Lỗi kích hoạt tài khoản"));
  }
};

// Set password and activate account
exports.setPasswordAndActivate = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return next(
        new ApiError(400, "Vui lòng nhập mật khẩu và xác nhận mật khẩu")
      );
    }

    if (password !== confirmPassword) {
      return next(new ApiError(400, "Mật khẩu xác nhận không khớp"));
    }

    if (password.length < 6) {
      return next(new ApiError(400, "Mật khẩu phải có ít nhất 6 ký tự"));
    }

    const user = await User.findOne({
      activationToken: token,
      activationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ApiError(400, "Token kích hoạt không hợp lệ hoặc đã hết hạn")
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Activate account and clear activation fields
    user.password = hashedPassword;
    user.isActive = true;
    user.activationToken = null;
    user.activationExpires = null;
    user.needsPasswordChange = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Tài khoản đã được kích hoạt thành công",
    });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Lỗi thiết lập mật khẩu"));
  }
};
