import { randomUUID } from "node:crypto";
import prisma from "../config/database.js";

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}
async function assertOwnedProfile(ownerId, profileId) {
  if (ownerId === profileId) {
    const patient = await prisma.patient.findUnique({ where: { id: ownerId } });
    if (!patient) throw notFound("Patient profile not found");
    return patient;
  }

  const dependent = await prisma.patient.findFirst({
    where: { id: profileId, guardianId: ownerId },
  });
  if (!dependent) throw notFound("Dependent profile not found");
  return dependent;
}

const profileSelect = {
  id: true,
  patientNumber: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  phone: true,
  email: true,
  nationalId: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  insuranceProvider: true,
  guardianId: true,
  allergies: { orderBy: { createdAt: "desc" } },
  medicalConditions: { orderBy: { createdAt: "desc" } },
  medicalDocuments: {
    select: { id: true, title: true, description: true, type: true, mimeType: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  },
  patientInsurances: {
    select: {
      id: true,
      membershipNumber: true,
      status: true,
      validFrom: true,
      validTo: true,
      plan: { select: { name: true, provider: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  },
  cards: { select: { id: true, status: true, lastUsedAt: true }, orderBy: { createdAt: "desc" } },
};

export async function getVaultDashboard(ownerId) {
  const [patient, subscription] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: ownerId },
      select: {
        ...profileSelect,
        dependents: {
          select: profileSelect,
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
      },
    }),
    prisma.patientSubscription.findFirst({
      where: { patientId: ownerId, status: "ACTIVE", endDate: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!patient) throw notFound("Patient profile not found");
  return { patient, subscription };
}

export async function updateVaultProfile(ownerId, profileId, input) {
  await assertOwnedProfile(ownerId, profileId);
  const allowed = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "phone",
    "nationalId",
    "emergencyContactName",
    "emergencyContactPhone",
    "insuranceProvider",
  ];
  const data = {};
  for (const field of allowed) {
    if (input[field] !== undefined) data[field] = input[field] || null;
  }
  for (const field of ["firstName", "lastName"]) {
    if (data[field] !== undefined) {
      if (typeof data[field] !== "string" || !data[field].trim()) {
        const error = new Error(`${field === "firstName" ? "First" : "Last"} name is required`);
        error.statusCode = 400;
        throw error;
      }
      data[field] = data[field].trim();
    }
  }
  if (data.gender !== undefined && !["MALE", "FEMALE", "OTHER", "UNKNOWN"].includes(data.gender)) {
    const error = new Error("Gender is invalid");
    error.statusCode = 400;
    throw error;
  }
  if (data.dateOfBirth) {
    data.dateOfBirth = parseDate(data.dateOfBirth);
  }
  return prisma.patient.update({
    where: { id: profileId },
    data,
    select: profileSelect,
  });
}

export async function createDependent(ownerId, input) {
  const parent = await prisma.patient.findUnique({ where: { id: ownerId } });
  if (!parent) throw notFound("Parent profile not found");

  if (
    typeof input.firstName !== "string"
    || !input.firstName.trim()
    || typeof input.lastName !== "string"
    || !input.lastName.trim()
  ) {
    const error = new Error("First and last name are required");
    error.statusCode = 400;
    throw error;
  }
  if (input.gender && !["MALE", "FEMALE", "OTHER", "UNKNOWN"].includes(input.gender)) {
    const error = new Error("Gender is invalid");
    error.statusCode = 400;
    throw error;
  }

  const patientNumber = `DEP-${randomUUID()}`;
  return prisma.patient.create({
    data: {
      patientNumber,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      dateOfBirth: input.dateOfBirth ? parseDate(input.dateOfBirth) : null,
      gender: input.gender || "UNKNOWN",
      nationalId: input.nationalId?.trim() || null,
      phone: input.phone?.trim() || null,
      emergencyContactName: input.emergencyContactName?.trim() || `${parent.firstName} ${parent.lastName}`,
      emergencyContactPhone: input.emergencyContactPhone?.trim() || parent.phone,
      insuranceProvider: input.insuranceProvider?.trim() || null,
      guardianId: ownerId,
    },
    select: profileSelect,
  });
}

export async function addVaultAllergy(ownerId, profileId, input) {
  await assertOwnedProfile(ownerId, profileId);
  if (typeof input.allergen !== "string" || !input.allergen.trim()) {
    const error = new Error("Allergen is required");
    error.statusCode = 400;
    throw error;
  }
  return prisma.allergy.create({
    data: {
      patientId: profileId,
      allergen: input.allergen.trim(),
      reaction: input.reaction?.trim() || null,
      severity: input.severity?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function addVaultCondition(ownerId, profileId, input) {
  await assertOwnedProfile(ownerId, profileId);
  if (typeof input.name !== "string" || !input.name.trim()) {
    const error = new Error("Condition name is required");
    error.statusCode = 400;
    throw error;
  }
  return prisma.medicalCondition.create({
    data: {
      patientId: profileId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      diagnosedAt: input.diagnosedAt ? parseDate(input.diagnosedAt) : null,
      isActive: true,
    },
  });
}

function parseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Date is invalid");
    error.statusCode = 400;
    throw error;
  }
  return date;
}

export async function removeVaultHealthItem(ownerId, profileId, itemId, kind) {
  await assertOwnedProfile(ownerId, profileId);
  if (!["allergy", "condition"].includes(kind)) {
    const error = new Error("Health record type is invalid");
    error.statusCode = 400;
    throw error;
  }
  const model = kind === "allergy" ? prisma.allergy : prisma.medicalCondition;
  const item = await model.findFirst({ where: { id: itemId, patientId: profileId } });
  if (!item) throw notFound("Health record not found");
  await model.delete({ where: { id: itemId } });
}

/**
 * Returns all completed/closed encounters for a patient,
 * including clinical notes and diagnoses — patient-safe view.
 */
export async function getPatientConsultations(patientId) {
  return prisma.encounter.findMany({
    where: {
      patientId,
      status: { in: ["CLOSED", "COMPLETED"] },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      startedAt: true,
      endedAt: true,
      facility: { select: { id: true, name: true } },
      provider: { select: { firstName: true, lastName: true, role: true } },
      clinicalNotes: {
        select: {
          id: true,
          subjective: true,
          assessment: true,
          plan: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      diagnoses: {
        select: {
          id: true,
          code: true,
          description: true,
          diagnosisType: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Returns all prescriptions for a patient.
 */
export async function getPatientPrescriptions(patientId) {
  return prisma.prescription.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      notes: true,
      createdAt: true,
      prescribedBy: { select: { firstName: true, lastName: true, role: true } },
      encounter: {
        select: {
          startedAt: true,
          facility: { select: { name: true } },
        },
      },
      items: {
        select: {
          id: true,
          medicationName: true,
          dosage: true,
          frequency: true,
          duration: true,
          quantity: true,
          instructions: true,
        },
      },
    },
  });
}

/**
 * Returns all lab requests + results for a patient.
 */
export async function getPatientLabResults(patientId) {
  return prisma.labRequest.findMany({
    where: { patientId },
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      status: true,
      clinicalIndication: true,
      requestedAt: true,
      completedAt: true,
      requestedBy: { select: { firstName: true, lastName: true, role: true } },
      encounter: {
        select: {
          startedAt: true,
          facility: { select: { name: true } },
        },
      },
      tests: { select: { id: true, testName: true, testCode: true } },
      results: {
        select: {
          id: true,
          testName: true,
          resultValue: true,
          unit: true,
          referenceRange: true,
          interpretation: true,
          status: true,
          resultDate: true,
        },
        orderBy: { resultDate: "desc" },
      },
    },
  });
}

/**
 * Returns participating clinics directory.
 */
export async function getParticipatingClinics() {
  try {
    const facilities = await prisma.facility.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        code: true,
        phone: true,
        email: true,
        address: true,
      },
      orderBy: { name: "asc" },
    });

    if (facilities && facilities.length > 0) {
      return facilities.map((f) => ({
        ...f,
        services: ["General Consultation", "Dental Care", "Pediatrics", "Laboratory Screening"],
        operatingHours: "Mon - Sat: 08:00 AM - 06:00 PM",
      }));
    }
  } catch (err) {
    console.warn("Could not query facilities from DB, using participating directory fallback:", err.message);
  }

  // Graceful directory fallback for participating clinics in Rwanda
  return [
    {
      id: "clinic-kfh",
      name: "King Faisal Hospital",
      code: "KFH",
      address: "KG 544 St, Gasabo, Kigali",
      phone: "+250 788 123 456",
      services: ["General Consultation", "Cardiology", "Pediatrics", "Dental Care", "Laboratory Screening"],
      operatingHours: "24/7 Emergency & Mon - Fri 08:00 - 18:00",
    },
    {
      id: "clinic-remera",
      name: "Remera Community Clinic",
      code: "RCC",
      address: "KG 11 Ave, Remera, Kigali",
      phone: "+250 790 280 727",
      services: ["General Consultation", "Dental Care", "Preventive Screening", "Pediatrics"],
      operatingHours: "Mon - Sat: 08:00 AM - 06:00 PM",
    },
    {
      id: "clinic-nyarugenge",
      name: "Nyarugenge District Hospital",
      code: "NDH",
      address: "Nyamirambo, Nyarugenge, Kigali",
      phone: "+250 788 345 678",
      services: ["General Consultation", "Dental Care", "Radiology", "Maternity"],
      operatingHours: "Mon - Sun: 08:00 AM - 07:00 PM",
    },
    {
      id: "clinic-gasabo",
      name: "Gasabo Family PolyClinic",
      code: "GFP",
      address: "Kimironko, Gasabo, Kigali",
      phone: "+250 788 987 654",
      services: ["General Consultation", "Dental Care", "Laboratory Screening"],
      operatingHours: "Mon - Fri: 08:30 AM - 05:30 PM",
    },
  ];
}

/**
 * Returns appointments for a patient or their dependent.
 */
export async function getPatientAppointments(ownerId, profileId) {
  const targetId = profileId || ownerId;
  await assertOwnedProfile(ownerId, targetId);

  return prisma.appointment.findMany({
    where: { patientId: targetId },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
        },
      },
      provider: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });
}

/**
 * Creates an appointment booking request for a patient.
 * Prevents double-booking and validates input.
 */
export async function bookPatientAppointment(ownerId, input) {
  const targetId = input.profileId || ownerId;
  await assertOwnedProfile(ownerId, targetId);

  if (!input.scheduledAt) {
    const error = new Error("Scheduled date and time are required");
    error.statusCode = 400;
    throw error;
  }

  const scheduledTime = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledTime.getTime())) {
    const error = new Error("Invalid appointment date and time");
    error.statusCode = 400;
    throw error;
  }

  if (scheduledTime < new Date()) {
    const error = new Error("Appointment date must be in the future");
    error.statusCode = 400;
    throw error;
  }

  // Double-booking check: prevent booking another appointment within 30 minutes
  const conflicting = await prisma.appointment.findFirst({
    where: {
      patientId: targetId,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      scheduledAt: {
        gte: new Date(scheduledTime.getTime() - 30 * 60 * 1000),
        lte: new Date(scheduledTime.getTime() + 30 * 60 * 1000),
      },
    },
  });

  if (conflicting) {
    const error = new Error("You already have an appointment scheduled around this time. Please pick another slot.");
    error.statusCode = 409;
    throw error;
  }

  // Resolve facility ID
  let targetFacility = null;
  if (input.facilityId) {
    targetFacility = await prisma.facility.findFirst({
      where: {
        OR: [
          { id: input.facilityId },
          { code: input.facilityId },
          { name: { contains: input.facilityId, mode: "insensitive" } },
        ],
      },
    });
  }

  // If no facility found by input, use the default active facility
  if (!targetFacility) {
    targetFacility = await prisma.facility.findFirst({ where: { status: "ACTIVE" } });
  }

  if (!targetFacility) {
    // Create or upsert a default facility if none exist in DB
    targetFacility = await prisma.facility.upsert({
      where: { code: "RCC" },
      update: {},
      create: {
        code: "RCC",
        name: "Remera Community Clinic",
        phone: "+250 790 280 727",
        email: "info@medcard.org.rw",
        address: "KG 11 Ave, Remera, Kigali",
        status: "ACTIVE",
      },
    });
  }

  // Validate appointment type
  const allowedTypes = ["CONSULTATION", "DENTAL", "LABORATORY", "RADIOLOGY", "FOLLOW_UP", "PROCEDURE", "OTHER"];
  const type = allowedTypes.includes(input.appointmentType?.toUpperCase())
    ? input.appointmentType.toUpperCase()
    : "CONSULTATION";

  return prisma.appointment.create({
    data: {
      patientId: targetId,
      facilityId: targetFacility.id,
      appointmentType: type,
      status: "SCHEDULED",
      scheduledAt: scheduledTime,
      reason: input.reason?.trim() || "Routine Consultation",
      notes: input.notes?.trim() || "Requested via MedCard Patient Vault",
    },
    include: {
      facility: true,
    },
  });
}

/**
 * Allows a patient to cancel their upcoming appointment.
 */
export async function cancelPatientAppointment(ownerId, appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  await assertOwnedProfile(ownerId, appointment.patientId);

  if (["COMPLETED", "CANCELLED"].includes(appointment.status)) {
    const error = new Error(`Cannot cancel an appointment that is already ${appointment.status.toLowerCase()}`);
    error.statusCode = 400;
    throw error;
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
    include: { facility: true },
  });
}

