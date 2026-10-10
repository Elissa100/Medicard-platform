import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listAppointments,
  updateStatus,
  createAppointment,
} from "../controllers/appointment.controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/", listAppointments);
router.post("/", createAppointment);
router.patch("/:appointmentId/status", updateStatus);

export default router;

