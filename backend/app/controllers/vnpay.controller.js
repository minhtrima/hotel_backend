const crypto = require("crypto");
const moment = require("moment");
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const ApiError = require("../utils/api-error");

// VNPay configuration
const vnp_TmnCode = "OB4L3FAI";
const vnp_HashSecret = "TFEPLE2R5QOEMZJAM9FIZKKW6ZTLGQ8I";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = "http://localhost:5174/booking/vnpay_return";

// Helper function to sort object
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

// Create VNPay payment URL
exports.createPaymentUrl = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { amount, orderDescription } = req.body;

    // Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new ApiError(404, "Không tìm thấy đặt phòng"));
    }

    process.env.TZ = "Asia/Ho_Chi_Minh";
    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket && req.connection.socket.remoteAddress);

    let orderId = `${booking.bookingCode}_${Date.now()}`; // Use booking code + timestamp
    let locale = "vn";
    let currCode = "VND";

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = vnp_TmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] =
      orderDescription || `Thanh toan dat phong ${booking.bookingCode}`;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100; // VNPay requires amount in xu (VND * 100)
    vnp_Params["vnp_ReturnUrl"] = vnp_ReturnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    let vnpayUrl =
      vnp_Url + "?" + querystring.stringify(vnp_Params, { encode: false });

    // Store payment record as pending
    const payment = new Payment({
      bookingId: bookingId,
      amount: amount,
      method: "vnpay",
      category: "online",
      status: "pending",
      transactionCode: orderId,
      note: `VNPay payment initiated for ${booking.bookingCode}`,
    });

    await payment.save();

    res.status(200).json({
      success: true,
      paymentUrl: vnpayUrl,
      orderId: orderId,
      message: "Payment URL created successfully",
    });
  } catch (error) {
    console.error("Error creating VNPay payment URL:", error);
    next(new ApiError(500, "Lỗi khi tạo liên kết thanh toán"));
  }
};

// Handle VNPay return
exports.vnpayReturn = async (req, res, next) => {
  try {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];

    // Extract booking ID from orderId (format: BOOKINGCODE_TIMESTAMP)
    let orderId = vnp_Params["vnp_TxnRef"];
    let rspCode = vnp_Params["vnp_ResponseCode"];
    let amount = vnp_Params["vnp_Amount"] / 100; // Convert back from xu to VND

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // Verify signature
    if (secureHash !== signed) {
      return res.status(200).json({
        success: false,
        message: "Chữ ký không hợp lệ",
        code: "97",
      });
    }

    // Find the payment record
    const payment = await Payment.findOne({ transactionCode: orderId });
    if (!payment) {
      return res.status(200).json({
        success: false,
        message: "Không tìm thấy giao dịch",
        code: "01",
      });
    }

    // Find the booking
    const booking = await Booking.findById(payment.bookingId)
      .populate("customerid")
      .populate("rooms.roomid")
      .populate("rooms.desiredRoomTypeId");

    if (!booking) {
      return res.status(200).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
        code: "01",
      });
    }

    // Process payment result
    if (rspCode === "00") {
      // Payment successful
      payment.status = "paid";
      payment.metadata = {
        vnpayResponseCode: rspCode,
        vnpayParams: vnp_Params,
      };
      payment.paidAt = new Date();
      await payment.save();

      // Update booking payment status
      const updatePaymentStatus = async (bookingId) => {
        try {
          const payments = await Payment.find({
            bookingId: bookingId,
            status: "paid",
          });

          const totalPaid = payments.reduce(
            (sum, payment) => sum + payment.amount,
            0
          );
          const totalPrice = booking.totalPrice || 0;

          let newPaymentStatus;
          if (totalPaid === 0) {
            newPaymentStatus = "unpaid";
          } else if (totalPaid >= totalPrice) {
            newPaymentStatus = "paid";
          } else {
            newPaymentStatus = "partially_paid";
          }

          if (booking.paymentStatus !== newPaymentStatus) {
            booking.paymentStatus = newPaymentStatus;
            await booking.save();
          }
        } catch (error) {
          console.error("Error updating payment status:", error);
        }
      };

      await updatePaymentStatus(booking._id);

      res.status(200).json({
        success: true,
        message: "Thanh toán thành công",
        booking: booking,
        payment: payment,
        code: "00",
      });
    } else {
      // Payment failed
      payment.status = "failed";
      payment.metadata = {
        vnpayResponseCode: rspCode,
        vnpayParams: vnp_Params,
      };
      payment.paidAt = new Date();
      await payment.save();

      res.status(200).json({
        success: false,
        message: "Thanh toán thất bại",
        booking: booking,
        payment: payment,
        code: rspCode,
      });
    }
  } catch (error) {
    console.error("Error processing VNPay return:", error);
    next(new ApiError(500, "Lỗi khi xử lý kết quả thanh toán"));
  }
};
