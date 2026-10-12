import { Router } from "express";
import {
  login,
  changePassword,
  getMe,
  logout,
} from "../controllers/vault-clinic-auth.controller.js";
import {
  authenticateVaultClinic,
} from "../../middleware/vault-clinic.middleware.js";

const router = Router();

// Public auth endpoints
router.post("/login", login);

// Protected endpoints
router.use(authenticateVaultClinic);
router.post("/change-password", changePassword);
router.get("/me", getMe);
router.post("/logout", logout);

export default router;
