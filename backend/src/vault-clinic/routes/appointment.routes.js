import { Router } from "express";
import {
  authenticateVaultClinic,
  requirePasswordChanged,
} from "../../middleware/vault-clinic.middleware.js";
import {
  listAppointments,
  createAppointment,
  confirmRequest,
  declineRequest,
  proposeTime,
  reschedule,
} from "../controllers/appointment.controller.js";

const router = Router();

router.use(authenticateVaultClinic);
router.use(requirePasswordChanged);

router.get("/", listAppointments);
router.post("/", createAppointment);
router.post("/:appointmentId/confirm", confirmRequest);
router.post("/:appointmentId/decline", declineRequest);
router.post("/:appointmentId/propose-time", proposeTime);
router.post("/:appointmentId/reschedule", reschedule);

export default router;
