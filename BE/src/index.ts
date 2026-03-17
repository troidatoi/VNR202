import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import accountRoutes from "./routes/accountRoutes";
import authRoutes from "./routes/authRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import consultantRoutes from "./routes/consultantRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import slotTimeRoutes from "./routes/slotTimeRoutes";
import eventRoutes from "./routes/eventRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import blogRoutes from "./routes/blogRoutes";
import quizRoutes from "./routes/quizRoutes";
import feedbackRoutes from "./routes/feedbackRoutes";
import paymentRoutes from "./routes/paymentRoutes";

import sponsorRoutes from "./routes/sponsorRoutes";
import eventFeedbackRoutes from "./routes/eventFeedbackRoutes";

import reportRoutes from "./routes/reportRoutes";
import questionRoutes from "./routes/questionRoutes";

import uploadRouter from "./routes/upload";
import aiRoutes from "./routes/aiRoutes";
import {
  startEventStatusCron,
  updateEventStatus,
} from "./utils/eventStatusManager";

// Load biến môi trường
dotenv.config();

// Khởi tạo app
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://mln111-1.onrender.com",
  "https://hcm202-group5.vercel.app",
  "https://mln131-group3-app.vercel.app/",
  "http://localhost:5173",
  "http://localhost:3000",
  // Thêm các origins từ biến môi trường (phân tách bằng dấu phẩy)
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  "*", // Cho phép tất cả origins tạm thời
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Log origin để debug trên Render console
      console.log("📥 Incoming Origin:", origin);

      // Cho phép các yêu cầu không có origin (như mobile apps hoặc curl)
      if (!origin) return callback(null, true);

      // Cho phép tất cả origins (deploy)
      if (origin === "*") return callback(null, true);

      // Kiểm tra trong danh sách allowedOrigins
      // Dùng regex hoặc includes giúp linh hoạt hơn với trailing slashes
      const isAllowed = allowedOrigins.some(allowed =>
        allowed === "*" || origin === allowed || origin === `${allowed}/`
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn("🚫 Origin blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());

// Kết nối DB
connectDB();
console.log("🧪 MONGO_URI =", process.env.MONGO_URI);

// Routes
app.use("/api/accounts", accountRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/consultants", consultantRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/slot-times", slotTimeRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/uploads", uploadRouter);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/event-feedback", eventFeedbackRoutes);
app.use("/api/ai", aiRoutes);

// Route kiểm tra
app.get("/", (_req, res) => {
  res.send(" HopeHub backend is running");
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("🔥 Global Error Handler caught:", err);

  // Đảm bảo vẫn trả về CORS header nếu có origin
  const origin = _req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin as string);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(` Server is running on http://localhost:${PORT}`);

  // Chạy update status ngay khi server start
  await updateEventStatus();

  // Bắt đầu cron job
  startEventStatusCron();
});
