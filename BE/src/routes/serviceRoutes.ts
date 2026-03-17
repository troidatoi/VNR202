import { Router } from "express";
import { createService, deleteService, getAllServices, getServiceById, getServiceByStatus, updateService, getServiceRating, updateServiceRating } from "../controllers/serviceController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = Router();

router.post("/", authMiddleware, roleMiddleware(["admin"]), createService);
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateService);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteService);
router.get("/status", getServiceByStatus);

// Các route mới cho rating
router.get("/:id/rating", getServiceRating);
router.post("/:id/update-rating", updateServiceRating);

export default router;  