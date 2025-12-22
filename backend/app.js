const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ApiError = require("./app/utils/api-error");

const authRouter = require("./app/routes/auth.route");
const accountRouter = require("./app/routes/account.route");
const staffRouter = require("./app/routes/staff.route");
const roomRouter = require("./app/routes/room.route");
const customerRouter = require("./app/routes/customer.route");
const bookingRouter = require("./app/routes/booking.route");
const typeRouter = require("./app/routes/type.route");
const serviceRouter = require("./app/routes/service.route");
const paymentRouter = require("./app/routes/payment.route");
const vnpayRouter = require("./app/routes/vnpayment.route");
const statisticsRouter = require("./app/routes/statistics.route");
const inventoryRouter = require("./app/routes/inventory.route");
const taskRouter = require("./app/routes/task.route");
const imageRouter = require("./app/routes/image.route");
const housekeepingRouter = require("./app/routes/housekeeping.route");
const inventorySlipRouter = require("./app/routes/inventorySlip.route");
const cccdScanRouter = require("./app/routes/cccdScan.route");
const reviewRouter = require("./app/routes/review.route");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://10.0.2.2:3000", // Android emulator
      "http://10.189.13.82:3000", // Android device/emulator với IP thực
      "http://192.168.1.100:3000", // Device thật - thay IP thực tế
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "abc" });
});

app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/staff", staffRouter);
app.use("/api/room", roomRouter);
app.use("/api/customer", customerRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/type", typeRouter);
app.use("/api/service", serviceRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/vnpay", vnpayRouter);
app.use("/api/statistics", statisticsRouter);
app.use("/api/inventories", inventoryRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/images", imageRouter);
app.use("/api/housekeeping", housekeepingRouter);
app.use("/api/inventory-slips", inventorySlipRouter);
app.use("/api/cccd-scan", cccdScanRouter);
app.use("/api/reviews", reviewRouter);
app.use((req, res, next) => {
  return next(new ApiError(404, "Resource not found"));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
