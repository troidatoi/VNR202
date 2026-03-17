import express from "express";
import { chatWithAI } from "../controllers/aiController";

const router = express.Router();

router.post("/chat", chatWithAI);

export default router;
