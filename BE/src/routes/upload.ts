import express from "express";
import upload from "../middleware/uploadImage";

const router = express.Router();

// Route upload ảnh
router.post("/upload", (upload as any).single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không có file nào được upload!" });
  }
  // req.file.path chứa URL của ảnh đã upload lên Cloudinary
  res.json({ imageUrl: req.file.path });
});

export default router;
