import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/database.js";
import {
  VAULT_CLINIC_JWT_SECRET,
  isIpLocked,
  recordFailedAttempt,
  clearFailedAttempts,
} from "../../middleware/vault-clinic.middleware.js";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function loginStaff({ email, password, ipAddress, userAgent }) {
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (ipAddress && isIpLocked(ipAddress)) {
    throw new Error("Too many failed sign in attempts from this network. Please try again in 15 minutes.");
  }

  const staff = await prisma.vaultClinicStaff.findUnique({
    where: { email: normalizedEmail },
    include: {
      facility: {
        include: {
          vaultSettings: true,
        },
      },
    },
  });

  if (!staff) {
    if (ipAddress) recordFailedAttempt(ipAddress);
    throw new Error("Invalid email or password");
  }

  if (!staff.isActive) {
    throw new Error("Account has been disabled. Please contact your clinic administrator.");
  }

  if (staff.lockedUntil && new Date(staff.lockedUntil) > new Date()) {
    const minutesLeft = Math.ceil((new Date(staff.lockedUntil).getTime() - Date.now()) / 60000);
    throw new Error(`Account is temporarily locked due to multiple failed sign in attempts. Please try again in ${minutesLeft} minute(s).`);
  }

  const isPasswordValid = await bcrypt.compare(password, staff.passwordHash);

  if (!isPasswordValid) {
    const failedAttempts = (staff.failedLoginAttempts || 0) + 1;
    let lockedUntil = null;

    if (failedAttempts >= LOCKOUT_THRESHOLD) {
      lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }

    await prisma.vaultClinicStaff.update({
      where: { id: staff.id },
      data: {
        failedLoginAttempts: failedAttempts,
        lockedUntil,
      },
    });

    if (ipAddress) recordFailedAttempt(ipAddress);

    await prisma.vaultAuditLog.create({
      data: {
        facilityId: staff.facilityId,
        staffId: staff.id,
        action: "AUTH_LOGIN_FAILED",
        entityType: "VaultClinicStaff",
        entityId: staff.id,
        details: { attempts: failedAttempts },
        ipAddress,
        userAgent,
      },
    });

    if (lockedUntil) {
      throw new Error("Account has been temporarily locked for 15 minutes due to too many failed attempts.");
    }

    throw new Error("Invalid email or password");
  }

  // Reset lockout counters on success
  await prisma.vaultClinicStaff.update({
    where: { id: staff.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  if (ipAddress) clearFailedAttempts(ipAddress);

  const payload = {
    staffId: staff.id,
    facilityId: staff.facilityId,
    role: staff.role,
    email: staff.email,
    aud: "vault-clinic",
  };

  const token = jwt.sign(payload, VAULT_CLINIC_JWT_SECRET, { expiresIn: "12h" });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId: staff.facilityId,
      staffId: staff.id,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "VaultClinicStaff",
      entityId: staff.id,
      ipAddress,
      userAgent,
    },
  });

  return {
    token,
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      mustChangePassword: staff.mustChangePassword,
      facility: {
        id: staff.facility.id,
        name: staff.facility.name,
        code: staff.facility.code,
        status: staff.facility.vaultSettings?.status || "INVITED",
        bookingMode: staff.facility.vaultSettings?.bookingMode || "MANUAL",
        operatingHours: staff.facility.vaultSettings?.operatingHours || null,
        slotDurationMinutes: staff.facility.vaultSettings?.slotDurationMinutes || 30,
      },
    },
  };
}

export async function changeStaffPassword({ staffId, currentPassword, newPassword, ipAddress, userAgent }) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long");
  }

  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  if (!hasUpper || !hasLower || !hasDigit) {
    throw new Error("New password must contain at least one uppercase letter, one lowercase letter, and one number");
  }

  const staff = await prisma.vaultClinicStaff.findUnique({
    where: { id: staffId },
  });

  if (!staff) {
    throw new Error("Staff record not found");
  }

  const matchesCurrent = await bcrypt.compare(currentPassword, staff.passwordHash);
  if (!matchesCurrent) {
    throw new Error("Current password is incorrect");
  }

  const isSamePassword = await bcrypt.compare(newPassword, staff.passwordHash);
  if (isSamePassword) {
    throw new Error("New password cannot be the same as your temporary password");
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.vaultClinicStaff.update({
    where: { id: staffId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId: staff.facilityId,
      staffId: staff.id,
      action: "AUTH_PASSWORD_CHANGED",
      entityType: "VaultClinicStaff",
      entityId: staff.id,
      ipAddress,
      userAgent,
    },
  });

  return {
    success: true,
    mustChangePassword: updated.mustChangePassword,
  };
}

export async function getStaffProfile(staffId) {
  const staff = await prisma.vaultClinicStaff.findUnique({
    where: { id: staffId },
    include: {
      facility: {
        include: {
          vaultSettings: true,
          vaultServices: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!staff) {
    throw new Error("Staff member not found");
  }

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    role: staff.role,
    mustChangePassword: staff.mustChangePassword,
    facility: {
      id: staff.facility.id,
      name: staff.facility.name,
      code: staff.facility.code,
      address: staff.facility.address,
      phone: staff.facility.phone,
      settings: staff.facility.vaultSettings,
      services: staff.facility.vaultServices,
    },
  };
}
