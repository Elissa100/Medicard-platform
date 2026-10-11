import {
  getFacilityAppointments,
  updateAppointmentStatus,
  createClinicAppointment,
  confirmAppointmentRequest,
  declineAppointmentRequest,
  proposeNewAppointmentTime,
  rescheduleAppointment,
  getClinicSettings,
  updateClinicSettings,
} from "../services/appointment.service.js";

export async function listAppointments(req, res) {
  try {
    const facilityId = req.user.facilityId || req.query.facilityId;
    if (!facilityId) {
      return res.status(400).json({ success: false, message: "Facility ID is required" });
    }

    const { status, date, providerId, startDate, endDate, view } = req.query;
    const appointments = await getFacilityAppointments(facilityId, {
      status,
      date,
      providerId,
      startDate,
      endDate,
      view,
    });
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error("List appointments failed:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load appointments",
    });
  }
}

export async function updateStatus(req, res) {
  try {
    const { appointmentId } = req.params;
    const { status, providerId, notes } = req.body;
    const updated = await updateAppointmentStatus(appointmentId, { status, providerId, notes }, req.user);
    res.json({ success: true, data: updated, message: `Appointment status updated to ${status}` });
  } catch (error) {
    console.error("Update appointment status failed:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update appointment",
    });
  }
}

export async function createAppointment(req, res) {
  try {
    const facilityId = req.user.facilityId || req.body.facilityId;
    const appointment = await createClinicAppointment({
      facilityId,
      ...req.body,
      user: req.user,
    });
    res.status(201).json({ success: true, data: appointment, message: "Appointment booked successfully" });
  } catch (error) {
    console.error("Create appointment failed:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create appointment",
    });
  }
}

export async function confirmRequest(req, res) {
  try {
    const { appointmentId } = req.params;
    const updated = await confirmAppointmentRequest(appointmentId, req.body, req.user);
    res.json({ success: true, data: updated, message: "Appointment request confirmed" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function declineRequest(req, res) {
  try {
    const { appointmentId } = req.params;
    const updated = await declineAppointmentRequest(appointmentId, req.body, req.user);
    res.json({ success: true, data: updated, message: "Appointment request declined" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function proposeTime(req, res) {
  try {
    const { appointmentId } = req.params;
    const updated = await proposeNewAppointmentTime(appointmentId, req.body, req.user);
    res.json({ success: true, data: updated, message: "New time proposed to patient" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function reschedule(req, res) {
  try {
    const { appointmentId } = req.params;
    const updated = await rescheduleAppointment(appointmentId, req.body, req.user);
    res.json({ success: true, data: updated, message: "Appointment rescheduled successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function getSettings(req, res) {
  try {
    const facilityId = req.user.facilityId || req.query.facilityId;
    const settings = await getClinicSettings(facilityId);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const facilityId = req.user.facilityId;
    const updated = await updateClinicSettings(facilityId, req.body);
    res.json({ success: true, data: updated, message: "Clinic settings updated" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}
