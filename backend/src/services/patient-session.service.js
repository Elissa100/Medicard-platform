import prisma from "../config/database.js";

export const SESSION_EXPIRY_HOURS = 12;
export const SESSION_EXPIRY_MS = SESSION_EXPIRY_HOURS * 60 * 60 * 1000;

export const createOrReusePatientSession = async ({
  patientId,
  userId,
  facilityId,
  encounterId,
}) => {
  const cutoff = new Date(Date.now() - SESSION_EXPIRY_MS);

  const existingSession = await prisma.patientSession.findFirst({
    where: {
      patientId,
      userId,
      facilityId,
      status: "ACTIVE",
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  // If session exists and has expired, mark it closed and create a fresh one
  if (existingSession) {
    if (existingSession.startedAt < cutoff) {
      await prisma.patientSession.update({
        where: { id: existingSession.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });
    } else {
      return prisma.patientSession.update({
        where: {
          id: existingSession.id,
        },
        data: {
          encounterId,
          lastActivityAt: new Date(),
        },
      });
    }
  }

  return prisma.patientSession.create({
    data: {
      patientId,
      userId,
      facilityId,
      encounterId,
      status: "ACTIVE",
    },
  });
};

export const closePatientSession = async (sessionId) => {
  return prisma.patientSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });
};

export const closeActiveSessionsForEncounter = async (encounterId) => {
  if (!encounterId) return { count: 0 };
  return prisma.patientSession.updateMany({
    where: {
      encounterId,
      status: "ACTIVE",
    },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });
};