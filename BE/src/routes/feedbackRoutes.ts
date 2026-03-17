import express from "express";
import { 
  createFeedback, 
  getFeedbackById, 
  getAllFeedbacks,
  getFeedbacksByServiceId,
  getFeedbacksByAccountId,
  getFeedbacksByAppointmentId,
  updateFeedbackStatus
} from "../controllers/feedbackController";

const router = express.Router();

// Tạo feedback mới
router.post("/", createFeedback);

// Lấy tất cả feedback
router.get("/", getAllFeedbacks);

// Lấy feedback theo ID
router.get("/:id", getFeedbackById);

// Cập nhật trạng thái feedback (approved/rejected)
router.put("/:id/status", updateFeedbackStatus);

// Lấy feedback theo service
router.get("/service/:serviceId", getFeedbacksByServiceId);

// Lấy feedback theo account
router.get("/account/:accountId", getFeedbacksByAccountId);

// Lấy feedback theo appointment
router.get("/appointment/:appointmentId", getFeedbacksByAppointmentId);

export default router;