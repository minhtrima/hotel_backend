const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

const sendActivationEmail = async (email, name, token) => {
  const activationUrl = `${process.env.STAFF_URL}/activate?token=${token}`;

  const mailOptions = {
    from: {
      name: "HaiAu Hotel Management System",
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: "Kích hoạt tài khoản - HaiAu Hotel",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">HaiAu Hotel</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Hotel Management System</p>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 20px;">Chào ${name}!</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Tài khoản nhân viên của bạn đã được tạo thành công trong hệ thống quản lý khách sạn HaiAu Hotel.
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          Để kích hoạt tài khoản và thiết lập mật khẩu, vui lòng nhấn vào nút bên dưới:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold; 
                    display: inline-block;">
            Kích hoạt tài khoản
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
          Hoặc copy và dán link sau vào trình duyệt của bạn:
        </p>
        <p style="word-break: break-all; background: #f9fafb; padding: 10px; border-radius: 5px; font-size: 12px; color: #374151;">
          ${activationUrl}
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #ef4444; font-size: 14px; margin-bottom: 10px;">
            <strong>Lưu ý quan trọng:</strong>
          </p>
          <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Link kích hoạt này sẽ hết hạn sau 24 giờ</li>
            <li>Bạn sẽ cần thiết lập mật khẩu mới khi kích hoạt tài khoản</li>
            <li>Nếu bạn không yêu cầu tạo tài khoản, vui lòng bỏ qua email này</li>
          </ul>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© 2024 HaiAu Hotel Management System</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send email", error };
  }
};

const sendBookingConfirmationEmail = async (booking, customer) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const roomsHtml = booking.rooms
    .map(
      (room, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${room.desiredRoomTypeId?.name || "Chưa chọn loại phòng"}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${formatDate(room.expectedCheckInDate)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${formatDate(room.expectedCheckOutDate)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${formatCurrency(room.pricePerNight)}
      </td>
    </tr>
  `
    )
    .join("");

  const servicesHtml = booking.services?.length
    ? `
    <div style="margin-top: 20px;">
      <h3 style="color: #1f2937; margin-bottom: 10px;">Dịch vụ đi kèm</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">Dịch vụ</th>
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: center;">Số lượng</th>
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: right;">Đơn giá</th>
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${booking.services
            .map(
              (service) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                ${service.serviceId?.name || "Dịch vụ"}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                ${service.quantity}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                ${formatCurrency(service.price)}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                ${formatCurrency(service.price * service.quantity)}
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
    : "";

  const mailOptions = {
    from: {
      name: "HaiAu Hotel",
      address: process.env.EMAIL_USER,
    },
    to: customer.email,
    subject: `Xác nhận đặt phòng #${booking.bookingCode} - HaiAu Hotel`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px;">
          <h1 style="color: white; margin: 0; font-size: 32px;">HaiAu Hotel</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Xác nhận đặt phòng thành công</p>
        </div>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
          <p style="color: #065f46; margin: 0; font-weight: bold;">
            ✓ Đặt phòng của bạn đã được xác nhận!
          </p>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 15px;">Kính gửi ${customer.honorific} ${customer.lastName} ${customer.firstName},</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Cảm ơn quý khách đã tin tưởng và lựa chọn HaiAu Hotel. Chúng tôi xin xác nhận đơn đặt phòng của quý khách với thông tin chi tiết như sau:
        </p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-top: 0;">Thông tin đặt phòng</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 40%;">Mã đặt phòng:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${booking.bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Trạng thái:</td>
              <td style="padding: 8px 0;">
                <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
                  Đã xác nhận
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Trạng thái thanh toán:</td>
              <td style="padding: 8px 0;">
                <span style="background-color: ${
                  booking.paymentStatus === "paid"
                    ? "#d1fae5"
                    : booking.paymentStatus === "partially_paid"
                      ? "#fef3c7"
                      : "#fee2e2"
                }; color: ${
                  booking.paymentStatus === "paid"
                    ? "#065f46"
                    : booking.paymentStatus === "partially_paid"
                      ? "#92400e"
                      : "#991b1b"
                }; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
                  ${
                    booking.paymentStatus === "paid"
                      ? "Đã thanh toán"
                      : booking.paymentStatus === "partially_paid"
                        ? "Thanh toán một phần"
                        : "Chưa thanh toán"
                  }
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Ngày đặt:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formatDate(booking.createdAt)}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-bottom: 10px;">Chi tiết phòng</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">#</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">Loại phòng</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">Nhận phòng</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">Trả phòng</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: right;">Giá/đêm</th>
              </tr>
            </thead>
            <tbody>
              ${roomsHtml}
            </tbody>
          </table>
        </div>

        ${servicesHtml}

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="color: #1f2937; margin: 0;">Tổng thanh toán:</h3>
            <h2 style="color: #2563eb; margin: 0; font-size: 28px;">${formatCurrency(booking.totalPrice)}</h2>
          </div>
        </div>

        ${
          booking.specialRequests
            ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
          <h4 style="color: #92400e; margin-top: 0;">Yêu cầu đặc biệt:</h4>
          <p style="color: #78350f; margin: 0;">${booking.specialRequests}</p>
        </div>
        `
            : ""
        }

        <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 8px;">
          <h3 style="color: #1e40af; margin-top: 0;">Thông tin liên hệ</h3>
          <p style="color: #1e40af; margin: 5px 0;">📞 Hotline: 0123-456-789</p>
          <p style="color: #1e40af; margin: 5px 0;">📧 Email: ${process.env.EMAIL_USER}</p>
          <p style="color: #1e40af; margin: 5px 0;">🏨 Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
            <strong>Lưu ý:</strong>
          </p>
          <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Vui lòng mang theo CMND/CCCD/Hộ chiếu khi làm thủ tục nhận phòng</li>
            <li>Giờ nhận phòng: 14:00 | Giờ trả phòng: 12:00</li>
            <li>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi</li>
          </ul>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p>© 2024 HaiAu Hotel - Nơi nghỉ dưỡng lý tưởng</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      "Booking confirmation email sent successfully to:",
      customer.email
    );
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return { success: false, message: "Failed to send email", error };
  }
};

const sendReceiptEmail = async (booking, customer, receiptData) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const roomsHtml = receiptData.rooms
    .map(
      (room, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${room.roomNumber}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${room.roomType}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${room.nights}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${formatCurrency(room.pricePerNight)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${formatCurrency(room.totalPrice)}
      </td>
    </tr>
  `
    )
    .join("");

  const servicesHtml = receiptData.services?.length
    ? `
    <div style="margin-top: 20px;">
      <h3 style="color: #1f2937; margin-bottom: 10px;">Dịch vụ sử dụng</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">Dịch vụ</th>
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: center;">Số lượng</th>
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: right;">Đơn giá</th>
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${receiptData.services
            .map(
              (service) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                ${service.name}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                ${service.quantity}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                ${formatCurrency(service.price)}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                ${formatCurrency(service.totalPrice)}
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
    : "";

  const mailOptions = {
    from: {
      name: "HaiAu Hotel",
      address: process.env.EMAIL_USER,
    },
    to: customer.email,
    subject: `Hóa đơn thanh toán #${booking.bookingCode} - HaiAu Hotel`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px;">
          <h1 style="color: white; margin: 0; font-size: 32px;">HaiAu Hotel</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Hóa đơn thanh toán</p>
        </div>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
          <p style="color: #065f46; margin: 0; font-weight: bold;">
            ✓ Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!
          </p>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 15px;">Kính gửi ${customer.honorific} ${customer.lastName} ${customer.firstName},</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Chúng tôi xin gửi tới quý khách hóa đơn chi tiết cho lần lưu trú tại HaiAu Hotel:
        </p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-top: 0;">Thông tin hóa đơn</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 40%;">Mã đặt phòng:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${booking.bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Ngày nhận phòng:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formatDate(receiptData.checkInDate)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Ngày trả phòng:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formatDate(receiptData.checkOutDate)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Tổng số đêm:</td>
              <td style="padding: 8px 0; color: #1f2937;">${receiptData.totalNights} đêm</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-bottom: 10px;">Chi tiết phòng</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">#</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">Số phòng</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">Loại phòng</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: center;">Số đêm</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: right;">Giá/đêm</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: right;">Tổng</th>
              </tr>
            </thead>
            <tbody>
              ${roomsHtml}
            </tbody>
          </table>
        </div>

        ${servicesHtml}

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; text-align: right;">Tổng tiền phòng:</td>
              <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 500; width: 150px;">${formatCurrency(receiptData.roomTotal)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; text-align: right;">Tổng tiền dịch vụ:</td>
              <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: 500;">${formatCurrency(receiptData.servicesTotal)}</td>
            </tr>
            <tr style="border-top: 2px solid #e5e7eb;">
              <td style="padding: 15px 0 0 0; color: #1f2937; text-align: right; font-size: 18px; font-weight: bold;">Tổng thanh toán:</td>
              <td style="padding: 15px 0 0 0; color: #2563eb; text-align: right; font-size: 24px; font-weight: bold;">${formatCurrency(receiptData.totalAmount)}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 8px;">
          <h3 style="color: #1e40af; margin-top: 0;">Thông tin liên hệ</h3>
          <p style="color: #1e40af; margin: 5px 0;">📞 Hotline: 0123-456-789</p>
          <p style="color: #1e40af; margin: 5px 0;">📧 Email: ${process.env.EMAIL_USER}</p>
          <p style="color: #1e40af; margin: 5px 0;">🏨 Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
        </div>

        <div style="margin-top: 30px; text-align: center; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
          <p style="color: #92400e; margin: 0; font-size: 16px; font-weight: 500;">
            🌟 Cảm ơn quý khách đã lựa chọn HaiAu Hotel!
          </p>
          <p style="color: #92400e; margin: 10px 0 0 0; font-size: 14px;">
            Chúng tôi rất mong được phục vụ quý khách trong những lần tới.
          </p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p>© 2024 HaiAu Hotel - Nơi nghỉ dưỡng lý tưởng</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Receipt email sent successfully to:", customer.email);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return { success: false, message: "Failed to send email", error };
  }
};

module.exports = {
  sendActivationEmail,
  sendBookingConfirmationEmail,
  sendReceiptEmail,
};
