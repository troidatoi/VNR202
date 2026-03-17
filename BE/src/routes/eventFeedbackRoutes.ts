import express from "express";
import { createEventFeedback, getEventFeedbacks, getEventFeedbacksByEventId } from "../controllers/eventFeedbackController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = express.Router();

// Gửi feedback cho sự kiện (user đã check-in)
router.post("/", authMiddleware, roleMiddleware(["customer"]), createEventFeedback);
// Lấy feedback của 1 sự kiện
router.get("/:eventId", getEventFeedbacks);
// Lấy feedback của 1 sự kiện theo eventId
router.get("/event/:eventId", getEventFeedbacksByEventId    );


export default router; 