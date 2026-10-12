import { Router } from "express";
import {
  authenticate,
  requirePlatformAdmin,
} from "../../middleware/auth.middleware.js";
import {
  getClinics,
  createClinic,
  updateStatus,
  getClinicDetail,
} from "../controllers/vault-clinic-admin.controller.js";

const router = Router();

router.use(authenticate);
router.use(requirePlatformAdmin("clinics"));

router.get("/", getClinics);
router.post("/", createClinic);
router.get("/:id", getClinicDetail);
router.patch("/:id/status", updateStatus);

export default router;
