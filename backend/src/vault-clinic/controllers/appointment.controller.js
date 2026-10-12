import {
  getFacilityAppointments,
  createClinicAppointment,
  confirmAppointmentRequest,
  declineAppointmentRequest,
  proposeNewAppointmentTime,
  rescheduleAppointment,
} from "../services/appointment.service.js";

function getMeta(req) {
  return {
    ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
}

export async function listAppointments(req, res) {
  try {
    const facilityId = req.vaultStaff.facilityId;
    const { status, date, vaultClinicianId, startDate, endDate } = req.query;

    const appointments = await getFacilityAppointments(
      facilityId,
      {
        status,
        date,
        vaultClinicianId: req.vaultStaff.role === "CLINICIAN" && !vaultClinicianId ? req.vaultStaff.id : vaultClinicianId,
        startDate,
        endDate,
      },
      req.vaultStaff
    );

    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load appointments",
    });
  }
}

export async function createAppointment(req, res) {
  try {
    const meta = getMeta(req);
    const appointment = await createClinicAppointment({
      facilityId: req.vaultStaff.facilityId,
      ...req.body,
      staff: req.vaultStaff,
      ...meta,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment scheduled successfully",
      data: appointment,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to create appointment",
    });
  }
}

export async function confirmRequest(req, res) {
  try {
    const { appointmentId } = req.params;
    const meta = getMeta(req);
    const updated = await confirmAppointmentRequest(
      appointmentId,
      req.vaultStaff.facilityId,
      req.body,
      req.vaultStaff,
      meta
    );

    return res.status(200).json({
      success: true,
      message: "Appointment request confirmed",
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to confirm appointment request",
    });
  }
}

export async function declineRequest(req, res) {
  try {
    const { appointmentId } = req.params;
    const { declineReason } = req.body;
    const meta = getMeta(req);
    const updated = await declineAppointmentRequest(
      appointmentId,
      req.vaultStaff.facilityId,
      declineReason,
      req.vaultStaff,
      meta
    );

    return res.status(200).json({
      success: true,
      message: "Appointment request declined",
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to decline appointment request",
    });
  }
}

export async function proposeTime(req, res) {
  try {
    const { appointmentId } = req.params;
    const { proposedTime, notes } = req.body;
    if (!proposedTime) {
      return res.status(400).json({ success: false, message: "Proposed time is required" });
    }

    const meta = getMeta(req);
    const updated = await proposeNewAppointmentTime(
      appointmentId,
      req.vaultStaff.facilityId,
      proposedTime,
      notes,
      req.vaultStaff,
      meta
    );

    return res.status(200).json({
      success: true,
      message: "Alternative appointment time proposed to patient",
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to propose alternative time",
    });
  }
}

export async function reschedule(req, res) {
  try {
    const { appointmentId } = req.params;
    const { scheduledAt, notes } = req.body;
    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: "New scheduled time is required" });
    }

    const meta = getMeta(req);
    const updated = await rescheduleAppointment(
      appointmentId,
      req.vaultStaff.facilityId,
      scheduledAt,
      notes,
      req.vaultStaff,
      meta
    );

    return res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to reschedule appointment",
    });
  }
}
