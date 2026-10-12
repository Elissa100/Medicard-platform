import prisma from "../../config/database.js";

/**
 * Validates whether a clinician already has an overlapping appointment in System 2.
 */
export async function checkClinicianConflict(vaultClinicianId, startTime, endTime, excludeAppointmentId = null) {
  if (!vaultClinicianId) return false;

  const where = {
    vaultClinicianId,
    status: {
      in: ["CONFIRMED", "SCHEDULED", "CHECKED_IN"],
    },
    scheduledAt: { lt: endTime },
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const existing = await prisma.appointment.findMany({
    where,
    select: { id: true, scheduledAt: true, scheduledEnd: true, durationMinutes: true },
  });

  for (const appt of existing) {
    const apptStart = new Date(appt.scheduledAt).getTime();
    const apptEnd = appt.scheduledEnd
      ? new Date(appt.scheduledEnd).getTime()
      : apptStart + (appt.durationMinutes || 30) * 60000;

    const newStart = startTime.getTime();
    const newEnd = endTime.getTime();

    if (apptStart < newEnd && apptEnd > newStart) {
      return true;
    }
  }

  return false;
}

/**
 * Returns all appointments for a clinic facility with optional clinician, status, or date filters.
 */
export async function getFacilityAppointments(facilityId, { status, date, vaultClinicianId, startDate, endDate }, staff) {
  const where = { facilityId };

  // If the logged in staff is a Clinician, they see their appointments by default or all if not filtered
  if (vaultClinicianId) {
    where.vaultClinicianId = vaultClinicianId;
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.scheduledAt = { gte: start, lte: end };
  } else if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where.scheduledAt = { gte: start, lte: end };
  }

  return prisma.appointment.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientNumber: true,
          phone: true,
          email: true,
          dateOfBirth: true,
          gender: true,
        },
      },
      vaultClinician: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

/**
 * Creates an appointment in System 2 with double-booking prevention.
 */
export async function createClinicAppointment({
  facilityId,
  patientId,
  vaultClinicianId,
  scheduledAt,
  durationMinutes = 30,
  reason,
  appointmentType = "CONSULTATION",
  sharedSections = [],
  staff,
  ipAddress,
  userAgent,
}) {
  const startTime = new Date(scheduledAt);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  if (vaultClinicianId) {
    const hasConflict = await checkClinicianConflict(vaultClinicianId, startTime, endTime);
    if (hasConflict) {
      const err = new Error("This clinician already has a scheduled consultation during the selected time slot.");
      err.statusCode = 409;
      throw err;
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      facilityId,
      patientId,
      vaultClinicianId: vaultClinicianId || null,
      scheduledAt: startTime,
      scheduledEnd: endTime,
      durationMinutes,
      reason,
      appointmentType,
      status: "CONFIRMED",
      sharedSections,
      source: "VAULT",
    },
    include: {
      patient: true,
      vaultClinician: true,
      facility: true,
    },
  });

  // Notify patient
  await prisma.patientNotification.create({
    data: {
      patientId,
      title: "Appointment Booked",
      message: `Your appointment at ${appointment.facility.name} on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()} has been confirmed.`,
      type: "APPOINTMENT_CONFIRMED",
      metadata: { appointmentId: appointment.id, facilityId },
    },
  });

  // Audit log
  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff?.id || null,
      action: "APPOINTMENT_CREATED",
      entityType: "Appointment",
      entityId: appointment.id,
      details: { patientId, scheduledAt: startTime.toISOString(), durationMinutes },
      ipAddress,
      userAgent,
    },
  });

  return appointment;
}

/**
 * Confirms a pending appointment request and optionally assigns a clinician.
 */
export async function confirmAppointmentRequest(appointmentId, facilityId, { vaultClinicianId, scheduledAt, notes }, staff, { ipAddress, userAgent } = {}) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, facilityId },
    include: { facility: true },
  });

  if (!appointment) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }

  const targetTime = scheduledAt ? new Date(scheduledAt) : new Date(appointment.scheduledAt);
  const duration = appointment.durationMinutes || 30;
  const targetEnd = new Date(targetTime.getTime() + duration * 60000);
  const targetClinician = vaultClinicianId || appointment.vaultClinicianId;

  if (targetClinician) {
    const conflict = await checkClinicianConflict(targetClinician, targetTime, targetEnd, appointmentId);
    if (conflict) {
      const err = new Error("Assigned clinician is already booked during this time window.");
      err.statusCode = 409;
      throw err;
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CONFIRMED",
      vaultClinicianId: targetClinician || null,
      scheduledAt: targetTime,
      scheduledEnd: targetEnd,
      notes: notes !== undefined ? notes : appointment.notes,
    },
    include: { patient: true, vaultClinician: true },
  });

  await prisma.patientNotification.create({
    data: {
      patientId: updated.patientId,
      title: "Appointment Request Confirmed",
      message: `Your appointment request at ${appointment.facility.name} has been approved for ${targetTime.toLocaleDateString()} at ${targetTime.toLocaleTimeString()}.`,
      type: "APPOINTMENT_APPROVED",
      metadata: { appointmentId: updated.id, facilityId },
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff?.id || null,
      action: "APPOINTMENT_CONFIRMED",
      entityType: "Appointment",
      entityId: updated.id,
      details: { vaultClinicianId: targetClinician, scheduledAt: targetTime.toISOString() },
      ipAddress,
      userAgent,
    },
  });

  return updated;
}

/**
 * Declines an appointment request with an explicit reason.
 */
export async function declineAppointmentRequest(appointmentId, facilityId, declineReason, staff, { ipAddress, userAgent } = {}) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, facilityId },
    include: { facility: true },
  });

  if (!appointment) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      declineReason: declineReason || "Clinic unable to accommodate requested slot",
    },
    include: { patient: true },
  });

  await prisma.patientNotification.create({
    data: {
      patientId: updated.patientId,
      title: "Appointment Request Declined",
      message: `Your appointment request at ${appointment.facility.name} could not be confirmed: ${declineReason || "Slot unavailable"}.`,
      type: "APPOINTMENT_DECLINED",
      metadata: { appointmentId: updated.id, facilityId },
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff?.id || null,
      action: "APPOINTMENT_DECLINED",
      entityType: "Appointment",
      entityId: updated.id,
      details: { declineReason },
      ipAddress,
      userAgent,
    },
  });

  return updated;
}

/**
 * Proposes a rescheduled time for a patient appointment.
 */
export async function proposeNewAppointmentTime(appointmentId, facilityId, proposedTime, notes, staff, { ipAddress, userAgent } = {}) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, facilityId },
    include: { facility: true },
  });

  if (!appointment) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }

  const proposed = new Date(proposedTime);

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      proposedTime: proposed,
      notes: notes !== undefined ? notes : appointment.notes,
    },
    include: { patient: true },
  });

  await prisma.patientNotification.create({
    data: {
      patientId: updated.patientId,
      title: "Proposed Rescheduled Time",
      message: `${appointment.facility.name} has proposed an alternative time for your visit: ${proposed.toLocaleDateString()} at ${proposed.toLocaleTimeString()}.`,
      type: "APPOINTMENT_RESCHEDULE_PROPOSED",
      metadata: { appointmentId: updated.id, proposedTime: proposed.toISOString(), facilityId },
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff?.id || null,
      action: "APPOINTMENT_PROPOSED_TIME",
      entityType: "Appointment",
      entityId: updated.id,
      details: { proposedTime: proposed.toISOString() },
      ipAddress,
      userAgent,
    },
  });

  return updated;
}

/**
 * Reschedules an appointment to a new date/time with conflict verification.
 */
export async function rescheduleAppointment(appointmentId, facilityId, newScheduledAt, notes, staff, { ipAddress, userAgent } = {}) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, facilityId },
  });

  if (!appointment) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }

  const startTime = new Date(newScheduledAt);
  const duration = appointment.durationMinutes || 30;
  const endTime = new Date(startTime.getTime() + duration * 60000);

  if (appointment.vaultClinicianId) {
    const hasConflict = await checkClinicianConflict(appointment.vaultClinicianId, startTime, endTime, appointmentId);
    if (hasConflict) {
      const err = new Error("Clinician already has an overlapping appointment during the selected time.");
      err.statusCode = 409;
      throw err;
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      scheduledAt: startTime,
      scheduledEnd: endTime,
      proposedTime: null,
      notes: notes !== undefined ? notes : appointment.notes,
    },
    include: { patient: true, vaultClinician: true },
  });

  await prisma.patientNotification.create({
    data: {
      patientId: updated.patientId,
      title: "Appointment Rescheduled",
      message: `Your appointment has been rescheduled to ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}.`,
      type: "APPOINTMENT_RESCHEDULED",
      metadata: { appointmentId: updated.id, facilityId },
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff?.id || null,
      action: "APPOINTMENT_RESCHEDULED",
      entityType: "Appointment",
      entityId: updated.id,
      details: { scheduledAt: startTime.toISOString() },
      ipAddress,
      userAgent,
    },
  });

  return updated;
}
