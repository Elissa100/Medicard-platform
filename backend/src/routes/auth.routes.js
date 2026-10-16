import express from "express";
import rateLimit from "express-rate-limit";
import {
  loginStaff,
  loginFacility,
  loginPatient,
  getCurrentUser,
  logout,
  loginPlatformAdmin,
  changePlatformAdminPassword,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many password reset attempts. Please try again in 15 minutes." },
});

/**
 * @route   POST /api/v1/auth/staff/login
 * @desc    Staff login
 * @access  Public
 */
router.post("/staff/login", loginStaff);

/**
 * @route   POST /api/v1/auth/facility/login
 * @desc    Facility login
 * @access  Public
 */
router.post("/facility/login", loginFacility);

/**
 * @route   POST /api/v1/auth/patient/login
 * @desc    Patient login (for vault)
 * @access  Public
 */
router.post("/patient/login", loginPatient);

/**
 * @route   POST /api/v1/auth/admin/login
 * @desc    Platform admin login (rate-limited, audit logged)
 * @access  Public
 */
router.post("/admin/login", adminLoginLimiter, loginPlatformAdmin);

/**
 * @route   POST /api/v1/auth/admin/change-password
 * @desc    Platform admin change password (requires Bearer token)
 * @access  Private (PLATFORM_ADMIN only)
 */
router.post("/admin/change-password", changePlatformAdminPassword);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset verification code
 * @access  Public
 */
router.post("/forgot-password", passwordResetLimiter, forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Verify code and set new password
 * @access  Public
 */
router.post("/reset-password", passwordResetLimiter, resetPassword);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", getCurrentUser);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout
 * @access  Private
 */
router.post("/logout", logout);

export default router;
