import { Router } from "express";
import { getAllSlotTime, getSlotTimeByConsultantId, createSlotTime, updateSlotTime, updateStatusSlotTime, getSlotTimeById, deleteSlotTime, getAvailableConsultantsByDay } from "../controllers/slotTimeController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = Router();

router.get("/", getAllSlotTime);
router.get("/:id", getSlotTimeById);
router.get("/consultant/:consultant_id", getSlotTimeByConsultantId);
router.post("/", authMiddleware, roleMiddleware(["admin", "consultant"]), createSlotTime);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "consultant"]), updateSlotTime);
router.put("/status/:id", updateStatusSlotTime);
router.delete("/:id", deleteSlotTime);
router.get("/available-by-day/:date", getAvailableConsultantsByDay);

export default router;