import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listAppointments,
  updateStatus,
  createAppointment,
  confirmRequest,
  declineRequest,
  proposeTime,
  reschedule,
  getSettings,
  updateSettings,
} from "../controllers/appointment.controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/", listAppointments);
router.post("/", createAppointment);
router.patch("/:appointmentId/status", updateStatus);
router.post("/:appointmentId/confirm", confirmRequest);
router.post("/:appointmentId/decline", declineRequest);
router.post("/:appointmentId/propose-time", proposeTime);
router.post("/:appointmentId/reschedule", reschedule);

router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

export default router;
