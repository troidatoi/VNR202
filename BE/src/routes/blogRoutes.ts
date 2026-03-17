import express from "express";
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogsByUserId,
  addComment,
  deleteComment,
  getComments,
  updateBlogStatus,
} from "../controllers/blogController";
import upload from "../middleware/uploadImage";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = express.Router();

// Lấy tất cả blogs
router.get("/", getAllBlogs);
// Lấy blog theo id
router.get("/:id", getBlogById);
// Tạo blog mới (có upload ảnh)
router.post("/", (upload as any).single("image"), createBlog);
// Cập nhật blog (có upload ảnh)
router.put("/:id", (upload as any).single("image"), updateBlog);
// Cập nhật trạng thái blog (chỉ admin)
router.patch("/:id/status", authMiddleware, roleMiddleware(["admin"]), updateBlogStatus);
// Xóa blog
router.delete("/:id", deleteBlog);
// Lấy blog theo userId
router.get("/user/:userId", getBlogsByUserId);

// Comment routes
router.get("/:id/comments", getComments);
router.post("/:id/comments", addComment);
router.delete("/:blogId/comments/:commentId", deleteComment);

export default router;
