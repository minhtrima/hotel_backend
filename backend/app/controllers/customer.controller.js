const Customer = require("../models/customer");
const Booking = require("../models/booking");
const ApiError = require("../utils/api-error");

exports.createCustomerData = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      honorific,
      email,
      phoneNumber,
      identificationNumber = null,
      identification = null,
      nationality,
      dateOfBirth = null,
    } = req.body;

    if (
      !firstName ||
      firstName.trim() === "" ||
      !lastName ||
      lastName.trim() === ""
    )
      return next(new ApiError(400, "Họ và tên là bắt buộc"));
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return next(new ApiError(400, "Email không hợp lệ"));
    if (
      !phoneNumber ||
      !/^(\+?84|0)[3-9]\d{8,9}$/.test(phoneNumber.replace(/[\s\-]/g, ""))
    ) {
      return next(new ApiError(400, "Số điện thoại không hợp lệ"));
    }

    // Build query conditions only for fields with values to avoid matching null
    const orConditions = [];
    if (identificationNumber) {
      orConditions.push({ identificationNumber: identificationNumber });
    }
    if (email) {
      orConditions.push({ email: email });
    }
    if (phoneNumber) {
      orConditions.push({ phoneNumber: phoneNumber });
    }

    const checkReplicaCustomer =
      orConditions.length > 0
        ? await Customer.findOne({ $or: orConditions })
        : null;

    if (checkReplicaCustomer) {
      checkReplicaCustomer.firstName = firstName;
      checkReplicaCustomer.lastName = lastName;
      checkReplicaCustomer.honorific = honorific;
      checkReplicaCustomer.email = email;
      checkReplicaCustomer.phoneNumber = phoneNumber;
      if (identificationNumber) {
        checkReplicaCustomer.identificationNumber = identificationNumber;
      }
      if (nationality) {
        checkReplicaCustomer.nationality = nationality;
      }
      if (dateOfBirth) {
        checkReplicaCustomer.dateOfBirth = dateOfBirth;
      }
      await checkReplicaCustomer.save();

      return res
        .status(201)
        .json({ success: true, customer: checkReplicaCustomer });
    } else {
      const customerData = new Customer({
        firstName,
        lastName,
        honorific,
        email,
        phoneNumber,
        identificationNumber: identificationNumber || null,
        identification: identification || null,
        nationality,
        dateOfBirth: dateOfBirth || null,
      });

      await customerData.save();

      res.status(201).json({ success: true, customer: customerData });
    }
  } catch (error) {
    console.log("Error creating customer data:", error);
    next(new ApiError(400, error.message));
  }
};

exports.getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find();
    res.status(200).json({ success: true, customers });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customerData = await Customer.findById(customerId);
    if (!customerData) {
      return next(new ApiError(404, "Customer not found"));
    }
    res.status(200).json({ success: true, customer: customerData });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { email, phoneNumber, identification, dateOfBirth } = req.body;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return next(new ApiError(400, "Email không hợp lệ"));

    // Check if email is being used by another customer
    if (email) {
      const existingCustomer = await Customer.findOne({
        email: email,
        _id: { $ne: req.params.id }, // Exclude current customer from check
      });
      if (existingCustomer) {
        return next(
          new ApiError(400, "Email này đã được sử dụng bởi khách hàng khác")
        );
      }
    }

    // Check if phone number is being used by another customer
    if (phoneNumber) {
      const existingCustomer = await Customer.findOne({
        phoneNumber: phoneNumber,
        _id: { $ne: req.params.id }, // Exclude current customer from check
      });
      if (existingCustomer) {
        return next(
          new ApiError(
            400,
            "Số điện thoại này đã được sử dụng bởi khách hàng khác"
          )
        );
      }
    }

    // More flexible phone number validation for Vietnamese numbers
    if (
      phoneNumber &&
      !/^(\+?84|0)[3-9]\d{8,9}$/.test(phoneNumber.replace(/[\s\-]/g, ""))
    )
      return next(new ApiError(400, "Số điện thoại không hợp lệ"));

    if (
      identification &&
      !["passport", "national_id", "driver_license"].includes(identification)
    )
      return next(new ApiError(400, "Giấy tờ định danh không hợp lệ"));

    if (dateOfBirth && isNaN(new Date(dateOfBirth)))
      return next(new ApiError(400, "Ngày sinh không hợp lệ"));

    const booking = await Booking.findOne({
      customerid: req.params.id,
    });

    if (booking) {
      booking.customerSnapshot = {
        honorific: req.body.honorific || booking.customerSnapshot.honorific,
        firstName: req.body.firstName || booking.customerSnapshot.firstName,
        lastName: req.body.lastName || booking.customerSnapshot.lastName,
        email: email || booking.customerSnapshot.email,
        phoneNumber: phoneNumber || booking.customerSnapshot.phoneNumber,
        identificationNumber:
          req.body.identificationNumber ||
          booking.customerSnapshot.identificationNumber,
      };

      await booking.save();
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCustomer)
      return next(new ApiError(404, "Không tìm thấy khách hàng"));

    res.status(200).json({ success: true, customer: updatedCustomer });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const bookings = await Booking.find({ customerId });
    if (bookings.length > 0) {
      return next(
        new ApiError(400, "Không thể xoá khách hàng có booking liên quan")
      );
    }

    const customerData = await Customer.findByIdAndDelete(customerId);
    if (!customerData) {
      return next(new ApiError(404, "Customer not found"));
    }
    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
