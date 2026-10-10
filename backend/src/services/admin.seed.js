import bcrypt from "bcryptjs";
import prisma from "../config/database.js";

/**
 * Runs on server start to guarantee platform admin is created or updated
 * to match ADMIN_EMAIL / ADMIN_PASSWORD from environment variables.
 */
export async function syncPlatformAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const resetPassword = process.env.RESET_ADMIN_PASSWORD === "true";

  if (!adminEmail || !adminPassword) {
    console.log("[admin-seed] ADMIN_EMAIL or ADMIN_PASSWORD not configured. Skipping.");
    return;
  }

  const cleanEmail = adminEmail.trim().toLowerCase();

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });

    if (existing) {
      if (existing.role !== "PLATFORM_ADMIN") {
        console.warn(`[admin-seed] User with email ${cleanEmail} already exists with role ${existing.role}. Skipping.`);
        return;
      }

      // If RESET_ADMIN_PASSWORD=true is set, update the password to match ADMIN_PASSWORD
      if (resetPassword) {
        const newHash = await bcrypt.hash(adminPassword, 10);
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            email: cleanEmail,
            passwordHash: newHash,
            mustChangePassword: false,
            isActive: true,
          },
        });
        console.log(`[admin-seed] Platform admin (${cleanEmail}) password synchronized with ADMIN_PASSWORD.`);
      } else {
        console.log(`[admin-seed] Platform admin (${cleanEmail}) exists and ready.`);
      }
      return;
    }

    // Create the platform admin if not found
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        firstName: "Platform",
        lastName: "Admin",
        role: "PLATFORM_ADMIN",
        isActive: true,
        emailVerified: true,
        mustChangePassword: false,
        facilityId: null,
        permissions: ["clinics", "users", "cards", "plans", "finance", "audit_log"],
      },
    });

    console.log(`[admin-seed] Platform admin account created successfully for ${cleanEmail}.`);
  } catch (error) {
    console.error("[admin-seed] Error synchronizing platform admin:", error.message);
  }
}

