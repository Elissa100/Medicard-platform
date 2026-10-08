import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "medcard-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Staff login
 */
export async function staffLogin(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { facility: true },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    throw new Error("Account is inactive");
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    facilityId: user.facilityId,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      facilityId: user.facilityId,
      facility: user.facility,
    },
  };
}

/**
 * Facility login
 */
export async function facilityLogin(email, password) {
  const facility = await prisma.facility.findUnique({
    where: { email },
    include: { users: true },
  });

  if (!facility) {
    throw new Error("Invalid facility credentials");
  }

  if (facility.status !== "ACTIVE") {
    throw new Error("Facility is not active");
  }

  // For facility login, we check if there's an admin user with this email
  const adminUser = facility.users.find((u) => u.email === email && u.role === "HOSPITAL_ADMIN");

  if (!adminUser) {
    throw new Error("Invalid facility credentials");
  }

  const isPasswordValid = await comparePassword(password, adminUser.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid facility credentials");
  }

  const token = generateToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    facilityId: facility.id,
  });

  return {
    token,
    facility: {
      id: facility.id,
      name: facility.name,
      code: facility.code,
      email: facility.email,
    },
    user: {
      id: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role,
    },
  };
}

/**
 * Patient login (for vault)
 */
export async function patientLogin(email, password) {
  const patient = await prisma.patient.findUnique({
    where: { email },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // For patients, we'll use a simple hash of the password stored in a separate field
  // For now, we'll use the patient's nationalId as a password reference
  // In production, you'd want a proper patient.auth table
  const isPasswordValid = await comparePassword(password, patient.nationalId || "");

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({
    patientId: patient.id,
    email: patient.email,
    type: "patient",
  });

  return {
    token,
    patient: {
      id: patient.id,
      patientNumber: patient.patientNumber,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
    },
  };
}

/**
 * Get user by token
 */
export async function getUserByToken(token) {
  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  if (decoded.type === "patient") {
    const patient = await prisma.patient.findUnique({
      where: { id: decoded.patientId },
    });

    if (!patient) {
      return null;
    }

    return {
      type: "patient",
      ...patient,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { facility: true },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    type: "staff",
    ...user,
  };
}
