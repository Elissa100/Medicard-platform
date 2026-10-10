import prisma from "../config/database.js";

/**
 * Returns all appointments for a clinic facility.
 */
export async function getFacilityAppointments(facilityId, { status, date }) {
  const where = { facilityId };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
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
 * Updates an appointment status (e.g. CONFIRMED, CANCELLED, COMPLETED, NO_SHOW).
 */
export async function updateAppointmentStatus(appointmentId, { status, providerId, notes }) {
  const allowedStatuses = ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];
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
 * Creates an appointment from the clinic desk.
 */
export async function createClinicAppointment({
  facilityId,
  patientId,
  providerId,
  appointmentType = "CONSULTATION",
  scheduledAt,
  reason,
  notes,
}) {
  return prisma.appointment.create({
    data: {
      facilityId,
      patientId,
      providerId: providerId || null,
      appointmentType,
      status: "CONFIRMED",
      scheduledAt: new Date(scheduledAt),
      reason,
      notes,
    },
    include: {
      patient: true,
      facility: true,
      provider: true,
    },
  });
}

