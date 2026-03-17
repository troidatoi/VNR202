import express from "express";
import {
  checkOTP,
  loginWithGoogle,
  register,
  sendNewVerifyEmail,
  sendResetPasswordEmailController,
} from "../controllers/authController";
import { login } from "../controllers/authController";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login-google", loginWithGoogle);
router.post("/send-new-verify-email", sendNewVerifyEmail);
router.post("/check-otp", checkOTP);
router.post("/send-reset-password-email", sendResetPasswordEmailController);

export default router;
