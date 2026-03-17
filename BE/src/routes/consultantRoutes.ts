import { Router } from "express";
import { createConsultant, getAllConsultants, getConsultantById, updateConsultant, deleteConsultant, getConsultantByAccountId } from "../controllers/consultantController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = Router();

router.get("/", getAllConsultants);
router.get("/account/:accountId", getConsultantByAccountId);
router.get("/:id", getConsultantById);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "consultant"]), updateConsultant);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteConsultant);
router.post("/", authMiddleware, roleMiddleware(["admin"]), createConsultant);

export default router;      