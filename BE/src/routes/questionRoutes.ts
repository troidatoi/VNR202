import express from "express";
import {
  createQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsByQuiz,
} from "../controllers/quizController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = express.Router();

// POST /api/questions - Tạo mới câu hỏi
router.post("/",authMiddleware,roleMiddleware(["admin"]), createQuestion);
// GET /api/questions/:id - Lấy chi tiết câu hỏi
router.get("/:id", getQuestionById);
// PUT /api/questions/:id - Cập nhật câu hỏi
router.put("/:id",authMiddleware,roleMiddleware(["admin"]), updateQuestion);
// DELETE /api/questions/:id - Xóa câu hỏi
router.delete("/:id",authMiddleware,roleMiddleware(["admin"]), deleteQuestion);
// GET /api/questions/quiz/:quizId - Lấy danh sách câu hỏi theo quizId
router.get("/quiz/:quizId", getQuestionsByQuiz);

export default router;
