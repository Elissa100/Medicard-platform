import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

export const VAULT_CLINIC_JWT_SECRET =
  process.env.VAULT_CLINIC_JWT_SECRET ||
  (process.env.JWT_SECRET || "medcard-secret-key-change-in-production") + "_vault_clinic";

const loginAttemptMap = new Map();

export function recordFailedAttempt(key) {
  const now = Date.now();
  const entry = loginAttemptMap.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + 15 * 60 * 1000;
  } else {
    entry.count += 1;
  }
  loginAttemptMap.set(key, entry);
  return entry.count;
}

export function clearFailedAttempts(key) {
  loginAttemptMap.delete(key);
}

export function isIpLocked(ip) {
  const entry = loginAttemptMap.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    loginAttemptMap.delete(ip);
    return false;
  }
  return entry.count >= 5;
}

export async function authenticateVaultClinic(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    let decoded;
    try {
      decoded = jwt.verify(token, VAULT_CLINIC_JWT_SECRET, {
        audience: "vault-clinic",
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid, expired, or non-vault-clinic token",
      });
    }

    if (!decoded || decoded.aud !== "vault-clinic" || !decoded.staffId) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid for patient vault clinic workspace",
      });
    }

    const staff = await prisma.vaultClinicStaff.findUnique({
      where: { id: decoded.staffId },
      include: {
        facility: {
          include: {
            vaultSettings: true,
          },
        },
      },
    });

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Staff member account not found",
      });
    }

    if (!staff.isActive) {
      return res.status(403).json({
        success: false,
        message: "Staff account is disabled",
      });
    }

    if (staff.lockedUntil && new Date(staff.lockedUntil) > new Date()) {
      return res.status(423).json({
        success: false,
        message: "Account is temporarily locked. Please try again later.",
      });
    }

    const vaultSettings = staff.facility?.vaultSettings;
    if (!vaultSettings) {
      return res.status(403).json({
        success: false,
        message: "Clinic has not been configured for Patient Vault access",
      });
    }

    if (vaultSettings.status === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: "Clinic access to Patient Vault is currently suspended",
      });
    }

    req.vaultStaff = staff;
    req.facility = staff.facility;
    req.vaultSettings = vaultSettings;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
}

export function requireVaultRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.vaultStaff) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.vaultStaff.role)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
}

export function requirePasswordChanged(req, res, next) {
  if (!req.vaultStaff) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.vaultStaff.mustChangePassword) {
    return res.status(403).json({
      success: false,
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "You must change your initial temporary password before continuing.",
    });
  }

  next();
}
