import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerEvent,
  unregisterEvent,
  getEventQRCode,
  checkInEvent,
  getEventAttendance,
  getRegisteredEvents,
  getCheckInHistory,
  cancelEvent,
} from "../controllers/eventController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = express.Router();

// CRUD routes
router.post("/", authMiddleware, roleMiddleware(["admin"]), createEvent);
router.get("/", getAllEvents);
router.get("/registered/:userId", getRegisteredEvents);
router.get("/:id", getEventById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateEvent);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteEvent);
router.put("/:id/cancel", authMiddleware, roleMiddleware(["admin"]), cancelEvent);

// Registration routes
router.post("/:id/register", authMiddleware, roleMiddleware(["customer"]), registerEvent);
router.post("/:id/unregister", authMiddleware, roleMiddleware(["customer"]), unregisterEvent);

// QR code và check-in routes
router.get("/:id/qr", getEventQRCode);
router.post("/:id/check-in", checkInEvent);
router.get("/:id/attendance", getEventAttendance);
router.get("/:id/check-in-history", getCheckInHistory);

export default router;
