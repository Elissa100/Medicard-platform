import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import { sendPasswordResetEmail } from "./email.service.js";

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

  if (user.role === "PLATFORM_ADMIN") {
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
  // Find admin user by email (facility login uses admin credentials)
  const adminUser = await prisma.user.findFirst({
    where: {
      email,
      role: "HOSPITAL_ADMIN",
      isActive: true,
    },
    include: { facility: true },
  });

  if (!adminUser) {
    throw new Error("Invalid facility credentials");
  }

  if (!adminUser.facility) {
    throw new Error("Facility not found");
  }

  if (adminUser.facility.status !== "ACTIVE") {
    throw new Error("Facility is not active");
  }

  const isPasswordValid = await comparePassword(password, adminUser.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid facility credentials");
  }

  const token = generateToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    facilityId: adminUser.facility.id,
  });

  return {
    token,
    facility: {
      id: adminUser.facility.id,
      name: adminUser.facility.name,
      code: adminUser.facility.code,
      email: adminUser.facility.email,
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
  const patient = await prisma.patient.findFirst({
    where: { email },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!patient.passwordHash) {
    throw new Error("Patient account not properly configured");
  }

  const isPasswordValid = await comparePassword(password, patient.passwordHash);

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

/**
 * Platform admin login
 */
export async function platformAdminLogin(email, password, { ipAddress, userAgent } = {}) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
  });

  const logEvent = async (action, userId) => {
    await prisma.securityAuditLog.create({
      data: { userId: userId ?? null, email: normalizedEmail, action, ipAddress, userAgent },
    });
  };

  if (!user || user.role !== "PLATFORM_ADMIN") {
    await logEvent("ADMIN_LOGIN_FAILED", null);
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    await logEvent("ADMIN_LOGIN_FAILED", user.id);
    throw new Error("Account is inactive");
  }

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid) {
    await logEvent("ADMIN_LOGIN_FAILED", user.id);
    throw new Error("Invalid credentials");
  }

  await logEvent("ADMIN_LOGIN_SUCCESS", user.id);

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });

  return {
    token,
    mustChangePassword: user.mustChangePassword,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
    },
  };
}

/**
 * Admin change password
 */
export async function adminChangePassword(userId, currentPassword, newPassword, { ipAddress, userAgent } = {}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== "PLATFORM_ADMIN") {
    throw new Error("Not authorized");
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);

  if (!valid) {
    throw new Error("Current password is incorrect");
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, mustChangePassword: false },
  });

  await prisma.securityAuditLog.create({
    data: {
      userId,
      email: user.email,
      action: "ADMIN_PASSWORD_CHANGED",
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Request password reset verification code
 */
export async function requestPasswordReset(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  // Look for existing account in Patient, User, or VaultClinicStaff
  const [patient, user, staff] = await Promise.all([
    prisma.patient.findFirst({ where: { email: cleanEmail, passwordHash: { not: null } } }),
    prisma.user.findFirst({ where: { email: cleanEmail } }),
    prisma.vaultClinicStaff.findFirst({ where: { email: cleanEmail, passwordHash: { not: null } } }),
  ]);

  if (!patient && !user && !staff) {
    throw new Error("No account found with this email address.");
  }

  // Generate 6-digit numeric verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.verificationCode.upsert({
    where: { email: cleanEmail },
    update: {
      code,
      expiresAt,
      verified: false,
    },
    create: {
      email: cleanEmail,
      code,
      expiresAt,
      verified: false,
    },
  });

  try {
    await sendPasswordResetEmail(cleanEmail, code);
  } catch (err) {
    console.error("Failed to deliver password reset email:", err);
    throw new Error("Unable to deliver verification email. Please try again shortly.");
  }

  return {
    success: true,
    message: "A 6-digit verification code has been sent to your email.",
  };
}

/**
 * Verify code and reset password
 */
export async function resetPasswordWithCode(email, code, newPassword) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanCode = String(code || "").trim();

  if (!cleanEmail || !cleanCode) {
    throw new Error("Email and verification code are required.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const record = await prisma.verificationCode.findFirst({
    where: {
      email: cleanEmail,
      code: cleanCode,
      verified: false,
      expiresAt: { gte: new Date() },
    },
  });

  if (!record) {
    throw new Error("Invalid or expired verification code. Please request a new one.");
  }

  const passwordHash = await hashPassword(newPassword);

  const updates = [
    prisma.patient.updateMany({
      where: { email: cleanEmail },
      data: { passwordHash },
    }),
    prisma.user.updateMany({
      where: { email: cleanEmail },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.vaultClinicStaff.updateMany({
      where: { email: cleanEmail },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.verificationCode.update({
      where: { id: record.id },
      data: { verified: true },
    }),
  ];

  await Promise.all(updates);

  return {
    success: true,
    message: "Password reset successfully. You can now sign in with your new password.",
  };
}

