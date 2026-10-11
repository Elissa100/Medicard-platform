import prisma from "../config/database.js";
import { SESSION_EXPIRY_MS } from "./patient-session.service.js";

export const buildFacilityAccessFilter = (facilityId) => {
  const sessionCutoff = new Date(Date.now() - SESSION_EXPIRY_MS);
  return {
    OR: [
      { appointments: { some: { facilityId } } },
      { encounters: { some: { facilityId } } },
      {
        patientSessions: {
          some: {
            facilityId,
            status: "ACTIVE",
            startedAt: { gte: sessionCutoff },
          },
        },
      },
    ],
  };
};

export const createPatient = async (data, facilityId, userId) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    email
  } = data;

  const patientNumber = await generatePatientNumber();

  return prisma.$transaction(async (tx) => {
    const patient = await tx.patient.create({
      data: {
        patientNumber,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || "UNKNOWN",
        phone: phone || null,
        email: email || null
      }
    });

    if (facilityId) {
      await tx.encounter.create({
        data: {
          patientId: patient.id,
          facilityId,
          type: "GENERAL",
          status: "OPEN",
        },
      });

      if (userId) {
        await tx.patientSession.create({
          data: {
            patientId: patient.id,
            facilityId,
            userId,
            status: "ACTIVE",
          },
        });
      }
    }

    return patient;
  });
};

export const getPatients = async ({ facilityId, page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;
  const facilityFilter = buildFacilityAccessFilter(facilityId);

  const where = search
    ? {
        AND: [
          facilityFilter,
          {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                lastName: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                patientNumber: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                phone: {
                  contains: search,
                  mode: "insensitive"
                }
              }
            ]
          }
        ]
      }
    : facilityFilter;

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    }),

    prisma.patient.count({ where })
  ]);

  return {
    patients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getPatientById = async (id, facilityId) => {
  const facilityFilter = buildFacilityAccessFilter(facilityId);

  return prisma.patient.findFirst({
    where: {
      id,
      ...facilityFilter,
    },
    include: {
      cards: true
    }
  });
};

export const patientExistsGlobally = async (id) => {
  const count = await prisma.patient.count({
    where: { id },
  });
  return count > 0;
};

export const updatePatient = async (id, facilityId, data) => {
  const accessible = await getPatientById(id, facilityId);
  if (!accessible) {
    return null;
  }

  const updateData = {};

  if (data.firstName !== undefined) {
    updateData.firstName = data.firstName;
  }

  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName;
  }

  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth
      ? new Date(data.dateOfBirth)
      : null;
  }

  if (data.gender !== undefined) {
    updateData.gender = data.gender;
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone || null;
  }

  if (data.email !== undefined) {
    updateData.email = data.email || null;
  }

  return prisma.patient.update({
    where: { id },
    data: updateData
  });
};

export const deletePatient = async (id, facilityId) => {
  const accessible = await getPatientById(id, facilityId);
  if (!accessible) {
    return null;
  }

  return prisma.patient.delete({
    where: { id }
  });
};

const generatePatientNumber = async () => {
  const year = new Date().getFullYear();

  const count = await prisma.patient.count();

  const nextNumber = String(count + 1).padStart(6, "0");

  return `MED-${year}-${nextNumber}`;
};