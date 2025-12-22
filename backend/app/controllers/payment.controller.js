const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
const Payment = require("../models/payment");
const Booking = require("../models/booking");
const { sendBookingConfirmationEmail } = require("../utils/emailService");

exports.createPayment = async (req, res) => {
  try {
    const {
      bookingId,
      userId,
      amount,
      method,
      category,
      status,
      isDeposit,
      transactionCode,
      note,
      metadata,
    } = req.body;

    if (!bookingId || !amount || !method || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (amount < 0) {
      return res.status(400).json({ message: "Amount must be >= 0" });
    }

    const paymentData = {
      bookingId,
      userId,
      amount,
      method,
      category,
      status,
      isDeposit,
      transactionCode,
      note,
      metadata,
    };

    // Set paidAt if status is paid
    if (status === "paid") {
      paymentData.paidAt = new Date();
    }

    const payment = await Payment.create(paymentData);

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const payments = await Payment.find({
      bookingId: bookingId,
      status: "paid",
    });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid === 0) {
      booking.paymentStatus = "unpaid";
    } else if (totalPaid < booking.totalPrice) {
      booking.paymentStatus = "partially_paid";
    } else {
      booking.paymentStatus = "paid";
    }

    await booking.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("bookingId")
      .populate("userId", "name email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate("bookingId")
      .populate("userId", "name email");

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handleVNPayment = async (req, res) => {
  try {
    const {
      bookingId,
      amount,
      vnp_ResponseCode,
      vnp_TransactionNo,
      vnp_Params,
    } = req.body;

    if (!bookingId || !amount || !vnp_ResponseCode || !vnp_TransactionNo) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const booking = await Booking.find
      .findById(bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const vnpay = new VNPay({
      tmnCode: process.env.VNP_TMNCODE,
      secureSecret: process.env.VNP_HASH_SECRET,
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      enableLog: true,
      loggerFn: ignoreLogger,
    });

    const payment = await Payment.create({
      bookingId,
      amount,
      method: "vnpay",
      category: "full_payment",
      status: vnp_ResponseCode === "00" ? "paid" : "failed",
      transactionCode: vnp_TransactionNo,
      metadata: {
        vnpayResponseCode: vnp_ResponseCode,
        vnpayParams: vnp_Params,
      },
      paidAt: vnp_ResponseCode === "00" ? new Date() : null,
    });
    // Update booking payment status if payment is successful
    if (vnp_ResponseCode === "00") {
      const payments = await Payment.find({
        bookingId: bookingId,
        status: "paid",
      });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid === 0) {
        booking.paymentStatus = "unpaid";
      } else if (totalPaid < booking.totalPrice) {
        booking.paymentStatus = "partially_paid";
      } else {
        booking.paymentStatus = "paid";
      }
      await booking.save();
    }
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handleVNPayPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Missing required VNPay parameters",
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId")
      .populate("services.serviceId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Create payment record

    const existingPayment = await Payment.findOne({
      bookingId: bookingId,
      method: "vnpay",
      status: "pending",
    }).sort({ createdAt: -1 });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "There is already a pending VNPay payment for this booking",
      });
    }

    const newPayment = await Payment.create({
      bookingId,
      customerId: booking.customerid,
      amount: booking.totalPrice,
      method: "vnpay",
      category: "online",
      status: "pending",
      note: `VNPay payment for booking ${booking.bookingCode}`,
    });

    const vnpay = new VNPay({
      tmnCode: process.env.vnp_TmnCode,
      secureSecret: process.env.vnp_HashSecret,
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      enableLog: true,
      loggerFn: ignoreLogger,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: booking.totalPrice * 100, // VNPay yêu cầu số tiền nhân 100
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_TxnRef: newPayment._id.toString(), // Định danh đơn hàng duy nhất
      vnp_OrderInfo: `Thanh toán đơn hàng #${booking.bookingCode}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.vnp_ReturnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json({
      success: true,
      paymentId: newPayment._id,
      vnpayUrl: vnpayResponse,
    });
  } catch (error) {
    console.error("Error handling VNPay payment:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing VNPay payment",
      error: error.message,
    });
  }
};

exports.handleVNPayReturn = async (req, res) => {
  aa;
  try {
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

    const {
      vnp_ResponseCode,
      vnp_Amount,
      vnp_TxnRef,
      vnp_TransactionNo,
      vnp_PayDate,
    } = req.query;

    // 1. Verify signature
    const isValid = vnpay.verifyReturnUrl(req.query);
    if (!isValid) {
      return res.redirect(
        `${CLIENT_URL}/booking/payment-failed?error=invalid-signature`
      );
    }

    // 2. Find payment by TxnRef (paymentId)
    const payment = await Payment.findById(vnp_TxnRef);
    if (!payment) {
      return res.redirect(
        `${CLIENT_URL}/booking/payment-failed?error=payment-not-found`
      );
    }

    const bookingId = payment.bookingId;

    // 3. Idempotent check
    if (payment.status !== "pending") {
      return res.redirect(
        `${CLIENT_URL}/booking/payment-success?bookingId=${bookingId}`
      );
    }

    // 4. Validate amount
    if (Number(vnp_Amount) !== payment.amount * 100) {
      payment.status = "failed";
      await payment.save();
      return res.redirect(
        `${CLIENT_URL}/booking/payment-failed?error=amount-mismatch`
      );
    }

    // 5. Handle result
    if (vnp_ResponseCode === "00") {
      payment.status = "paid";
      payment.transactionCode = vnp_TransactionNo;
      payment.paidAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        vnpayResponseCode: vnp_ResponseCode,
        vnpayPayDate: vnp_PayDate,
        vnpayAmount: vnp_Amount,
      };
      await payment.save();

      const booking = await Booking.findById(bookingId);
      if (booking) {
        const totalPaid = await Payment.aggregate([
          { $match: { bookingId, status: "paid" } },
          { $group: { _id: null, sum: { $sum: "$amount" } } },
        ]);

        const paid = totalPaid[0]?.sum || 0;

        if (paid >= booking.totalPrice) {
          booking.paymentStatus = "paid";
          booking.status = "booked";
        } else {
          booking.paymentStatus = "partially_paid";
        }

        await booking.save();
      }

      // Gửi email xác nhận đặt phòng
      try {
        const bookingWithDetails = await Booking.findById(bookingId)
          .populate("customerid")
          .populate("rooms.desiredRoomTypeId")
          .populate("services.serviceId");

        if (
          bookingWithDetails &&
          bookingWithDetails.customerid &&
          bookingWithDetails.customerid.email
        ) {
          await sendBookingConfirmationEmail(
            bookingWithDetails,
            bookingWithDetails.customerid
          );
        }
      } catch (emailError) {
        console.error("Error sending booking confirmation email:", emailError);
        // Don't block the payment flow if email fails
      }

      return res.redirect(
        `${CLIENT_URL}/booking/payment-success?bookingId=${bookingId}&paymentId=${payment._id}`
      );
    }

    payment.status = "failed";
    await payment.save();

    return res.redirect(
      `${CLIENT_URL}/booking/payment-failed?bookingId=${bookingId}&error=${vnp_ResponseCode}`
    );
  } catch (error) {
    console.error("VNPay return error:", error);
    return res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:5173"}/booking/payment-failed?error=server-error`
    );
  }
};

exports.handleManualPayment = async (req, res) => {
  try {
    const { bookingId, method } = req.body;
    if (!bookingId || !method) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const deleteResult = await Payment.deleteMany({
      bookingId: bookingId,
      status: "pending",
    });

    const booking = await Booking.findByIdAndUpdate(bookingId, {
      status: "booked",
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Gửi email xác nhận đặt phòng
    try {
      const bookingWithDetails = await Booking.findById(bookingId)
        .populate("customerid")
        .populate("rooms.desiredRoomTypeId")
        .populate("services.serviceId");

      if (
        bookingWithDetails &&
        bookingWithDetails.customerid &&
        bookingWithDetails.customerid.email
      ) {
        await sendBookingConfirmationEmail(
          bookingWithDetails,
          bookingWithDetails.customerid
        );
      }
    } catch (emailError) {
      console.error("Error sending booking confirmation email:", emailError);
      // Don't block the payment flow if email fails
    }

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentsByBooking = async (req, res) => {
  try {
    const payments = await Payment.find({
      bookingId: req.params.bookingId,
    }).sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionCode, metadata } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = status;

    if (status === "paid") {
      payment.paidAt = new Date();
    }

    if (transactionCode) payment.transactionCode = transactionCode;
    if (metadata) payment.metadata = metadata;

    await payment.save();

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
