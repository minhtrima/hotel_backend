const User = require("../models/user");
const ApiError = require("../utils/api-error");
const bcrypt = require("bcrypt");
const { createSecretToken } = require("../utils/secretToken");
const crypto = require("crypto");
// const CloudinaryService = require("../services/cloudinary.service");
// const multer = require("multer");
// const sendEmail = require("../utils/nodeMailer");
// const authService = new AuthService();
// const cloudinaryService = new CloudinaryService();

exports.create = async (req, res, next) => {
  const { email, name, role = "staff" } = req.body;

  if (!email) {
    return next(new ApiError(400, "Email cannot be empty"));
  }
  if (!name) {
    return next(new ApiError(400, "name cannot be empty"));
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, "User already exists"));
    }

    const generatedPassword = crypto.randomBytes(9).toString("base64");
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully. Please log in to continue.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      password: generatedPassword, // Return the generated password
      success: true,
    });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "An error occurred while creating the user"));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return next(new ApiError(400, "Email không được bỏ trống"));
    }
    if (!password) {
      return next(new ApiError(400, "Password không được bỏ trống"));
    }

    const user = await User.findOne({ email }).populate("staffId");

    if (!user) {
      return next(new ApiError(401, "Email hoặc mật khẩu không đúng"));
    }
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return next(new ApiError(401, "Email hoặc mật khẩu không đúng"));
    }
    const token = createSecretToken(user._id, user.role);

    // Use staff avatar if user is staff and has staffId
    let avatar = user.avatar;
    if (user.role === "staff" && user.staffId && user.staffId.avatar) {
      avatar = user.staffId.avatar;
      // Sync user avatar with staff avatar if different
      if (user.avatar !== user.staffId.avatar) {
        user.avatar = user.staffId.avatar;
        await user.save();
      }
    }

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: user.role === "admin" ? 86400000 : 1800000,
      })
      .status(200)
      .json({
        message: "User logged in successfully",
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: avatar,
          role: user.role,
          staffId: user.staffId,
        },
      });
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "An error occurred while logging to server"));
  }
};

exports.logout = (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "An error occurred while logging out"));
  }
};

exports.findAll = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ message: "List of users", users });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Internal message errors"));
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }
    return res.status(200).json({
      message: "User profile retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        identification: user.identification,

        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return next(
      new ApiError(500, "An error occurred while fetching user profile")
    );
  }
};

// exports.setAdmin = async (req, res, next) => {
//   try {
//     const { userId, password } = req.body;
//     if (!(await bcrypt.compare(password, req.user.password))) {
//       return next(new ApiError(400, "Password is incorrected"));
//     }
//     const user = await authService.setAdmin(userId);
//     return res
//       .status(200)
//       .json({ message: `Set ${user.name} admin successfully`, user });
//   } catch (error) {
//     console.log(error);
//     return next(new ApiError(400, "Can not set user to admin"));
//   }
// };

// exports.findDataById = async (req, res, next) => {
//   try {
//     const userId = req.params.id;
//     const user = await authService.findById(userId);
//     if (!user) {
//       return next(new ApiError(404, "Không tìm thấy người dùng"));
//     }
//     return res.status(200).json({
//       success: true,
//       user: {
//         phone: user.phone,
//         address: user.address,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     return next(
//       new ApiError(500, "An error occurred while fetching user data")
//     );
//   }
// };

// exports.changeName = async (req, res, next) => {
//   try {
//     const userId = req.params.id;
//     const newName = req.body.name;

//     if (!newName || newName.trim() === "") {
//       return next(new ApiError(400, "Tên mới không được bỏ trống"));
//     }
//     const user = await authService.findById(userId);
//     if (!user) {
//       return next(new ApiError(404, "Không tìm thấy người dùng"));
//     }
//     const result = await authService.changeName(userId, newName);

//     return res.status(200).json({
//       success: true,
//       message: "Tên đã được cập nhật",
//       user: {
//         id: result._id,
//         name: result.name,
//         email: result.email,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     return next(new ApiError(500, "Có lỗi xảy ra khi đổi tên"));
//   }
// };

// exports.getAddresses = async (req, res, next) => {
//   try {
//     const userId = req.params.id;
//     const user = await authService.findById(userId);
//     if (!user) {
//       return next(new ApiError(404, "Không tìm thấy người dùng"));
//     }
//     const addresses = user.address;

//     return res.status(200).json({
//       success: true,
//       message: "Đã tìm được danh sách địa chỉ",
//       addresses,
//     });
//   } catch (error) {
//     console.log(error);
//     return next(new ApiError(500, "Có lỗi xảy ra tìm khi địa chỉ"));
//   }
// };

// exports.getPhones = async (req, res, next) => {
//   try {
//     const userId = req.params.id;
//     const user = await authService.findById(userId);
//     if (!user) {
//       return next(new ApiError(404, "Không tìm thấy người dùng"));
//     }
//     const phones = user.phone;

//     return res.status(200).json({
//       success: true,
//       message: "Đã tìm được danh sách số điện thoại",
//       phones,
//     });
//   } catch (error) {
//     console.log(error);
//     return next(new ApiError(500, "Có lỗi xảy ra tìm số điện thoại"));
//   }
// };

// exports.saveAddress = async (req, res, next) => {
//   try {
//     const userId = req.params.id;
//     const newAddresses = req.body.addresses;

//     const user = await authService.findById(userId);
//     if (!user) {
//       return next(new ApiError(404, "Không tìm thấy người dùng"));
//     }

//     const primaryCount = newAddresses.filter(
//       (address) => address.isPrimary
//     ).length;
//     if (primaryCount > 1) {
//       newAddresses.forEach((address, index) => {
//         address.isPrimary = index === 0; // Only the first address is primary
//       });
//     }

//     if (primaryCount === 0 && newAddresses.length > 0) {
//       newAddresses[0].isPrimary = true;
//     }

//     const result = await authService.changeAddress(user, newAddresses);
//     if (!result) {
//       return res.status(200).json({
//         success: false,
//         message: "Có lỗi xảy ra khi lưu địa chỉ",
//       });
//     }
//     return res.status(200).json({
//       success: true,
//       message: "Lưu địa chỉ thành công",
//       address: result.address,
//     });
//   } catch (error) {
//     console.log(error);
//     return next(new ApiError(500, "Có lỗi xảy ra khi lưu địa chỉ"));
//   }
// };

// exports.savePhone = async (req, res, next) => {
//   try {
//     const userId = req.params.id;
//     const newPhones = req.body.phones;
//     console.log(newPhones);

//     const user = await authService.findById(userId);
//     if (!user) {
//       return next(new ApiError(404, "Không tìm thấy người dùng"));
//     }

//     const primaryCount = newPhones.filter((phone) => phone.isPrimary).length;
//     if (primaryCount > 1) {
//       newPhones.forEach((phone, index) => {
//         phone.isPrimary = index === 0;
//       });
//     }

//     if (primaryCount === 0 && newPhones.length > 0) {
//       newPhones[0].isPrimary = true;
//     }

//     const result = await authService.changePhone(user, newPhones);
//     if (!result) {
//       return res.status(200).json({
//         success: false,
//         message: "Có lỗi xảy ra khi lưu số điện thoại",
//       });
//     }
//     return res.status(200).json({
//       success: true,
//       message: "Lưu số điện thoại thành công",
//       phone: result.phone,
//     });
//   } catch (error) {
//     console.log(error);
//     return next(new ApiError(500, "Có lỗi xảy ra khi lưu số điện thoại"));
//   }
// };

// Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return next(new ApiError(400, "Vui lòng nhập đầy đủ thông tin"));
    }

    if (newPassword.length < 6) {
      return next(new ApiError(400, "Mật khẩu mới phải có ít nhất 6 ký tự"));
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, "Không tìm thấy người dùng"));
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return next(new ApiError(400, "Mật khẩu hiện tại không đúng"));
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return next(
        new ApiError(400, "Mật khẩu mới phải khác mật khẩu hiện tại")
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(user._id, {
      password: hashedNewPassword,
      needsPasswordChange: false, // Reset this flag if it exists
    });

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return next(new ApiError(500, "Có lỗi xảy ra khi đổi mật khẩu"));
  }
};

// exports.changeAvatar = async (req, res, next) => {
//   const storage = multer.memoryStorage();
//   const upload = multer({ storage }).single("avatar");

//   try {
//     upload(req, res, async (err) => {
//       if (err) {
//         return next(new ApiError(500, "Có lỗi xảy ra khi tải ảnh lên"));
//       }
//       const userId = req.params.id;
//       const newAvatar = req.body.isBuffer ? req.file.buffer : req.body.avatar;
//       const user = await authService.findById(userId);
//       if (!user) {
//         return next(new ApiError(404, "Không tìm thấy người dùng"));
//       }
//       try {
//         const result = await cloudinaryService.uploadImages(newAvatar);
//         if (!result) {
//           return res.status(200).json({
//             success: false,
//             message: "Có lỗi xảy ra khi lưu ảnh đại diện",
//           });
//         }

//         const avatarUrl = await authService.saveAvatar(user, result.secure_url);
//         return res.status(200).json({
//           success: true,
//           message: "Lưu ảnh đại diện thành công",
//           avatar: avatarUrl,
//         });
//       } catch (uploadError) {
//         return next(
//           new ApiError(500, "Có lỗi xảy ra khi tải ảnh lên Cloudinary")
//         );
//       }
//     });
//   } catch (error) {
//     console.log(error);
//     return next(new ApiError(500, "Có lỗi xảy ra khi lưu ảnh đại diện"));
//   }
// };
