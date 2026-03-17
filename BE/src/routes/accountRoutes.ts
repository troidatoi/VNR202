import express from "express";
import {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  changePassword,
} from "../controllers/accountController";
import { authMiddleware, roleMiddleware } from "../middleware";

const router = express.Router();

// Filter accounts by role if role query parameter is provided
router.get("/", async (req, res, next) => {
  if (req.query.role) {
    try {
      const accounts = await require("../models/Account").default.find({ 
        role: req.query.role,
        isDisabled: false
      });
      return res.status(200).json(accounts);
    } catch (error) {
      return res.status(500).json({ message: "Lỗi khi lọc tài khoản theo role", error });
    }
  }
  next();
});

router.post("/", createAccount);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getAllAccounts);
router.get("/:id", getAccountById);
router.put("/:id", updateAccount);
router.delete("/:id",authMiddleware, roleMiddleware(["admin"]), deleteAccount);
router.post("/change-password", changePassword);

// Thêm route kiểm tra số điện thoại
router.get("/check-phone/:phone", async (req, res) => {
  const { phone } = req.params;
  const { excludeId } = req.query;
  try {
    const query: any = { phoneNumber: phone };
    if (excludeId) query._id = { $ne: excludeId };
    const existed = await require("../models/Account").default.findOne(query);
    res.json({ existed: !!existed });
  } catch (err) {
    res.status(500).json({ message: "Lỗi kiểm tra số điện thoại" });
  }
});

export default router;
