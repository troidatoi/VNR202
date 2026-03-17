import { Router } from "express";
import { createAppointment, getAllAppointments, getAppointmentById, updateStatusAppointment, getAppointmentByUserId, getAppointmentByConsultantId, getAppointmentBySlotTimeId, deleteAppointment, rescheduleAppointment, capNhatLinkMeet } from "../controllers/appointmentController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = Router();

router.post("/",authMiddleware, createAppointment);
router.get("/", getAllAppointments);
router.get("/:id", getAppointmentById);
router.put("/status/:id", updateStatusAppointment);
router.put("/reschedule/:id",authMiddleware, rescheduleAppointment);
router.put("/meet-link/:id", authMiddleware,roleMiddleware(["admin","consultant"]), capNhatLinkMeet);
router.get("/user/:id", getAppointmentByUserId);
router.get("/consultant/:id", getAppointmentByConsultantId);
router.get("/slotTime/:id", getAppointmentBySlotTimeId);
router.delete("/:id", authMiddleware,roleMiddleware(["admin","consultant","customer"]), deleteAppointment);

export default router;