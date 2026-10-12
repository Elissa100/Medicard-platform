import prisma from "../../config/database.js";

function maskPhone(phone) {
  if (!phone) return null;
  const clean = phone.trim();
  if (clean.length < 7) return "***";
  return clean.slice(0, 7) + " *** " + clean.slice(-3);
}

export async function lookupPatient(facilityId, staff, query, { ipAddress, userAgent } = {}) {
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) {
    throw new Error("Lookup query is required");
  }

  // Audit log every lookup attempt
  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff?.id || null,
      action: "PATIENT_LOOKUP_ATTEMPT",
      entityType: "Patient",
      details: { query: cleanQuery },
      ipAddress,
      userAgent,
    },
  });

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [
        { patientNumber: { equals: cleanQuery, mode: "insensitive" } },
        { phone: { contains: cleanQuery } },
        { nationalId: { equals: cleanQuery } },
      ],
    },
    select: {
      id: true,
      patientNumber: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      dateOfBirth: true,
      gender: true,
      isTestPatient: true,
    },
  });

  if (!patient) {
    return null;
  }

  // Check if clinic has an active grant or existing booking
  const [activeGrant, existingAppointment] = await Promise.all([
    prisma.vaultAccessGrant.findFirst({
      where: {
        facilityId,
        patientId: patient.id,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: "desc" },
    }),
    prisma.appointment.findFirst({
      where: {
        facilityId,
        patientId: patient.id,
      },
      orderBy: { scheduledAt: "desc" },
    }),
  ]);

  const hasRelationship = Boolean(activeGrant || existingAppointment);

  // If no relationship exists, release ONLY masked initials, YOB, and masked phone
  if (!hasRelationship) {
    const initials = `${patient.firstName ? patient.firstName[0].toUpperCase() : ""}. ${patient.lastName ? patient.lastName[0].toUpperCase() : ""}.`;
    const yearOfBirth = patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : null;

    return {
      id: patient.id,
      patientNumber: patient.patientNumber,
      initials,
      yearOfBirth,
      maskedPhone: maskPhone(patient.phone),
      isMasked: true,
      hasGrant: false,
      hasAppointment: false,
      isTestPatient: Boolean(patient.isTestPatient),
    };
  }

  // Relationship exists -> release full basic demographic details
  return {
    id: patient.id,
    patientNumber: patient.patientNumber,
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    email: patient.email,
    gender: patient.gender,
    dateOfBirth: patient.dateOfBirth,
    isMasked: false,
    hasGrant: Boolean(activeGrant),
    grantDetails: activeGrant
      ? {
          id: activeGrant.id,
          source: activeGrant.source,
          expiresAt: activeGrant.expiresAt,
          sharedSections: activeGrant.sharedSections,
        }
      : null,
    hasAppointment: Boolean(existingAppointment),
    isTestPatient: Boolean(patient.isTestPatient),
  };
}

export async function getPatientVaultClinicalData(facilityId, patientId, staff, { ipAddress, userAgent } = {}) {
  // Clinicians only
  if (staff.role !== "CLINICIAN") {
    const err = new Error("Clinical vault records are restricted to authorized clinicians only");
    err.statusCode = 403;
    throw err;
  }

  // Check active grant
  const grant = await prisma.vaultAccessGrant.findFirst({
    where: {
      facilityId,
      patientId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });

  // If no grant, check confirmed appointment with shared sections
  const appointment = !grant
    ? await prisma.appointment.findFirst({
        where: {
          facilityId,
          patientId,
          status: "CONFIRMED",
        },
        orderBy: { scheduledAt: "desc" },
      })
    : null;

  if (!grant && !appointment) {
    const err = new Error("Access denied. An active consent grant or confirmed appointment is required to access personal vault records.");
    err.statusCode = 403;
    throw err;
  }

  const sharedSections = grant
    ? grant.sharedSections
    : appointment?.sharedSections || [];

  const includeAll = sharedSections.length === 0;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      patientNumber: true,
      firstName: true,
      lastName: true,
      gender: true,
      dateOfBirth: true,
      phone: true,
      email: true,
      allergies: includeAll || sharedSections.includes("ALLERGIES") ? { orderBy: { createdAt: "desc" } } : false,
      medicalConditions: includeAll || sharedSections.includes("CONDITIONS") ? { orderBy: { createdAt: "desc" } } : false,
      prescriptions: includeAll || sharedSections.includes("PRESCRIPTIONS") ? { orderBy: { createdAt: "desc" } } : false,
      diagnoses: includeAll || sharedSections.includes("DIAGNOSES") ? { orderBy: { createdAt: "desc" } } : false,
      medicalDocuments: includeAll || sharedSections.includes("DOCUMENTS")
        ? {
            select: { id: true, title: true, description: true, type: true, mimeType: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          }
        : false,
    },
  });

  if (!patient) {
    const err = new Error("Patient profile not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff.id,
      action: "PATIENT_VAULT_VIEWED",
      entityType: "Patient",
      entityId: patient.id,
      details: { grantId: grant?.id || null, sharedSections },
      ipAddress,
      userAgent,
    },
  });

  return {
    patient,
    grant: grant
      ? {
          id: grant.id,
          source: grant.source,
          expiresAt: grant.expiresAt,
          sharedSections: grant.sharedSections,
        }
      : null,
  };
}

export async function simulateMockCardTap(facilityId, patientId, staff, { ipAddress, userAgent } = {}) {
  if (process.env.VAULT_CLINIC_MOCK_TAP !== "true") {
    const err = new Error("Mocked card tap simulator is disabled in this environment");
    err.statusCode = 403;
    throw err;
  }

  if (staff.role !== "CLINICIAN") {
    const err = new Error("Only clinicians can create consent grants via card tap");
    err.statusCode = 403;
    throw err;
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient || !patient.isTestPatient) {
    const err = new Error("Mocked card tap is restricted to verified test patients only");
    err.statusCode = 400;
    throw err;
  }

  // 24-hour full clinical access grant
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const grant = await prisma.vaultAccessGrant.create({
    data: {
      facilityId,
      patientId,
      source: "CARD_TAP",
      sharedSections: ["ALLERGIES", "CONDITIONS", "PRESCRIPTIONS", "DIAGNOSES", "DOCUMENTS"],
      status: "ACTIVE",
      expiresAt,
      createdById: staff.id,
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff.id,
      action: "MOCK_CARD_TAP_GRANT_CREATED",
      entityType: "VaultAccessGrant",
      entityId: grant.id,
      details: { patientId, expiresAt: expiresAt.toISOString() },
      ipAddress,
      userAgent,
    },
  });

  return grant;
}

export async function listFacilityGrants(facilityId) {
  return prisma.vaultAccessGrant.findMany({
    where: {
      facilityId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientNumber: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { expiresAt: "asc" },
  });
}

export async function revokeAccessGrant(facilityId, grantId, staff, reason, { ipAddress, userAgent } = {}) {
  const grant = await prisma.vaultAccessGrant.findFirst({
    where: { id: grantId, facilityId },
  });

  if (!grant) {
    const err = new Error("Access grant not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.vaultAccessGrant.update({
    where: { id: grantId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedById: staff.id,
      revokeReason: reason || "Revoked by clinician",
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: staff.id,
      action: "ACCESS_GRANT_REVOKED",
      entityType: "VaultAccessGrant",
      entityId: grant.id,
      details: { reason },
      ipAddress,
      userAgent,
    },
  });

  return updated;
}

