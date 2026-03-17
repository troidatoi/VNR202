import { Router } from "express";
import { createCertificate, getAllCertificates, getCertificateById, updateCertificate, deleteCertificate, getCertificatesByConsultantId } from "../controllers/certificateController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = Router();


router.post("/", authMiddleware,roleMiddleware(["admin","consultant"]), createCertificate);
router.get("/", getAllCertificates);
router.get("/consultant/:consultantId", getCertificatesByConsultantId);
router.get("/:id", getCertificateById);
router.put("/:id", authMiddleware,roleMiddleware(["admin","consultant"]), updateCertificate);
router.delete("/:id", authMiddleware,roleMiddleware(["admin","consultant"]), deleteCertificate);


router.get("/consultant/:consultantId", getCertificatesByConsultantId);

export default router;  