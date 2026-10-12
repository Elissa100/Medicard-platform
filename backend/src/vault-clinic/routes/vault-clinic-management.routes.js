import { Router } from "express";
import {
  authenticateVaultClinic,
  requirePasswordChanged,
  requireVaultRole,
} from "../../middleware/vault-clinic.middleware.js";
import {
  getSettings,
  updateSettings,
  getServices,
  addService,
  toggleService,
  getStaff,
  inviteStaff,
  toggleStaff,
} from "../controllers/vault-clinic-management.controller.js";

const router = Router();

router.use(authenticateVaultClinic);
router.use(requirePasswordChanged);
router.use(requireVaultRole("CLINIC_ADMIN"));

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

// Services
router.get("/services", getServices);
router.post("/services", addService);
router.patch("/services/:id/toggle", toggleService);

// Staff
router.get("/staff", getStaff);
router.post("/staff", inviteStaff);
router.patch("/staff/:id/toggle", toggleStaff);

export default router;

