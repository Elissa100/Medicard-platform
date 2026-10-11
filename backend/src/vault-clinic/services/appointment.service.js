import prisma from "../config/database.js";

/**
 * Validates whether a provider already has an overlapping appointment.
 */
export async function checkProviderConflict(providerId, startTime, endTime, excludeAppointmentId = null) {
  if (!providerId) return false;

  const where = {
    providerId,
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

    // Overlap condition: startA < endB && endA > startB
    if (apptStart < newEnd && apptEnd > newStart) {
      return true;
    }
  }

  return false;
}

/**
 * Returns all appointments for a clinic facility with optional provider, status, date, or mode filters.
 */
export async function getFacilityAppointments(facilityId, { status, date, providerId, startDate, endDate, view }) {
  const where = { facilityId };

  if (providerId) {
    where.providerId = providerId;
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
          emergencyContactName: true,
          emergencyContactPhone: true,
        },
      },
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

/**
 * Creates an appointment with transactional double-booking prevention.
 */
export async function createClinicAppointment({
  facilityId,
  patientId,
  providerId,
  appointmentType = "CONSULTATION",
  scheduledAt,
  durationMinutes = 30,
  reason,
  notes,
  user,
}) {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  return prisma.$transaction(async (tx) => {
    if (providerId) {
      // Overlap check inside transaction
      const conflict = await tx.appointment.findFirst({
        where: {
          providerId,
          status: { in: ["CONFIRMED", "SCHEDULED", "CHECKED_IN"] },
          scheduledAt: { lt: end },
        },
      });

      if (conflict) {
        const conflictStart = new Date(conflict.scheduledAt).getTime();
        const conflictEnd = conflict.scheduledEnd
          ? new Date(conflict.scheduledEnd).getTime()
          : conflictStart + (conflict.durationMinutes || 30) * 60000;

        if (conflictStart < end.getTime() && conflictEnd > start.getTime()) {
          const err = new Error("This practitioner already has an appointment scheduled during this time slot.");
          err.statusCode = 409;
          throw err;
        }
      }
    }

    const appt = await tx.appointment.create({
      data: {
        facilityId,
        patientId,
        providerId: providerId || null,
        appointmentType,
        status: "CONFIRMED",
        scheduledAt: start,
        scheduledEnd: end,
        durationMinutes,
        reason,
        notes,
      },
      include: {
        patient: true,
        facility: true,
        provider: true,
      },
    });

    return appt;
  });
}

/**
 * Confirms a pending appointment request.
 */
export async function confirmAppointmentRequest(appointmentId, { providerId, notes }, clinicUser) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  const assignedProviderId = providerId || appt.providerId;
  const start = new Date(appt.scheduledAt);
  const duration = appt.durationMinutes || 30;
  const end = new Date(start.getTime() + duration * 60000);

  if (assignedProviderId) {
    const hasConflict = await checkProviderConflict(assignedProviderId, start, end, appointmentId);
    if (hasConflict) {
      const error = new Error("Assigned provider has a schedule conflict for this time slot.");
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CONFIRMED",
      providerId: assignedProviderId,
      scheduledEnd: end,
      notes: notes || appt.notes,
    },
    include: {
      patient: true,
      facility: true,
      provider: true,
    },
  });
}

/**
 * Declines an appointment request with reason.
 */
export async function declineAppointmentRequest(appointmentId, { declineReason }, clinicUser) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "DECLINED",
      declineReason: declineReason || "Practitioner unavailable at requested time.",
    },
    include: {
      patient: true,
      facility: true,
      provider: true,
    },
  });
}

/**
 * Proposes a new appointment time to the patient.
 */
export async function proposeNewAppointmentTime(appointmentId, { proposedTime, notes }, clinicUser) {
  const prop = new Date(proposedTime);
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "RESCHEDULING",
      proposedTime: prop,
      notes: notes ? `Proposed new time: ${prop.toLocaleString()}. Note: ${notes}` : `Proposed new time: ${prop.toLocaleString()}`,
    },
    include: {
      patient: true,
      facility: true,
      provider: true,
    },
  });
}

/**
 * Reschedules an appointment to a new date and time.
 */
export async function rescheduleAppointment(appointmentId, { scheduledAt, durationMinutes = 30, providerId, notes }, clinicUser) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const targetProviderId = providerId || appt.providerId;

  if (targetProviderId) {
    const hasConflict = await checkProviderConflict(targetProviderId, start, end, appointmentId);
    if (hasConflict) {
      const error = new Error("This practitioner is already booked during this time slot.");
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CONFIRMED",
      scheduledAt: start,
      scheduledEnd: end,
      durationMinutes,
      providerId: targetProviderId,
      notes: notes || appt.notes,
    },
    include: {
      patient: true,
      facility: true,
      provider: true,
    },
  });
}

/**
 * Updates status (CHECKED_IN, COMPLETED, NO_SHOW, CANCELLED)
 */
export async function updateAppointmentStatus(appointmentId, { status, providerId, notes }, clinicUser) {
  const allowedStatuses = ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW", "DECLINED", "RESCHEDULING"];
  if (!allowedStatuses.includes(status)) {
    const error = new Error(`Invalid status: ${status}`);
    error.statusCode = 400;
    throw error;
  }

  const data = { status };
  if (providerId) data.providerId = providerId;
  if (notes) data.notes = notes;

  return prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: {
      patient: true,
      facility: true,
      provider: true,
    },
  });
}

/**
 * Returns facility settings (booking mode and operating hours).
 */
export async function getClinicSettings(facilityId) {
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: {
      id: true,
      name: true,
      code: true,
      bookingMode: true,
      operatingHours: true,
    },
  });

  return facility || {
    bookingMode: "MANUAL",
    operatingHours: {
      monday: { open: "08:00", close: "17:00", active: true },
      tuesday: { open: "08:00", close: "17:00", active: true },
      wednesday: { open: "08:00", close: "17:00", active: true },
      thursday: { open: "08:00", close: "17:00", active: true },
      friday: { open: "08:00", close: "17:00", active: true },
      saturday: { open: "09:00", close: "13:00", active: true },
      sunday: { open: "00:00", close: "00:00", active: false },
    },
  };
}

/**
 * Updates facility settings.
 */
export async function updateClinicSettings(facilityId, { bookingMode, operatingHours }) {
  const data = {};
  if (bookingMode) data.bookingMode = bookingMode;
  if (operatingHours) data.operatingHours = operatingHours;

  return prisma.facility.update({
    where: { id: facilityId },
    data,
    select: {
      id: true,
      name: true,
      code: true,
      bookingMode: true,
      operatingHours: true,
    },
  });
}
