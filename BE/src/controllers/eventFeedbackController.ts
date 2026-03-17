import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import EventFeedback from "../models/EventFeedback";
import EventRegistration from "../models/EventRegistration";

// Gửi feedback cho sự kiện
export const createEventFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, content, rating, userId: userIdFromBody } = req.body;
    const userId = req.user?._id || userIdFromBody;
    console.log("[Feedback] userId:", userId, "eventId:", eventId);
    if (!eventId || !content || !rating || !userId) {
      return res.status(400).json({ message: "Thiếu thông tin feedback" });
    }
    // Kiểm tra user đã đăng ký và check-in chưa
    const registration = await EventRegistration.findOne({
      eventId,
      userId,
      status: "active",
      checkedInAt: { $ne: null }
    });
    console.log("[Feedback] registration found:", registration);
    if (!registration) {
      return res.status(403).json({ message: "Bạn chưa tham gia sự kiện này hoặc chưa check-in!" });
    }
    // Kiểm tra đã feedback chưa (1 user chỉ feedback 1 lần)
    const existed = await EventFeedback.findOne({ eventId, userId });
    if (existed) {
      return res.status(400).json({ message: "Bạn đã gửi feedback cho sự kiện này!" });
    }
    const feedback = await EventFeedback.create({ eventId, userId, content, rating });
    res.status(201).json({ message: "Gửi feedback thành công!", feedback });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi gửi feedback", error });
  }
};

// Lấy feedback của 1 sự kiện
export const getEventFeedbacks = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const feedbacks = await EventFeedback.find({ eventId }).populate("userId", "fullName");
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy feedback sự kiện", error });
  }
}; 
export const getEventFeedbacksByEventId = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const feedbacks = await EventFeedback.find({ eventId }).populate("userId", "fullName");
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy feedback sự kiện", error });
  }
};