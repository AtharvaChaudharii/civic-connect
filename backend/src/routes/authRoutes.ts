import { Router } from "express";
import { register, login, getMe, forgotPassword, verifyOtp, resetPassword } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", authenticate, getMe);

export default router;
