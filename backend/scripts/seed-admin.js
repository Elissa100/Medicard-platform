import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const resetPassword = process.argv.includes("--reset-password");

if (!connectionString) {
  console.error("error: DATABASE_URL is not set in environment");
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error(
    "error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment"
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    if (existing.role !== "PLATFORM_ADMIN") {
      console.error(
        `error: a user with that email already exists with role ${existing.role}. aborting.`
      );
      process.exit(1);
    }

    if (!resetPassword) {
      console.log("platform admin already exists. nothing to do.");
      console.log("pass --reset-password to overwrite the password.");
      return;
    }

    const newHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash: newHash, mustChangePassword: true },
    });
    console.log("platform admin password reset. mustChangePassword set to true.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      role: "PLATFORM_ADMIN",
      isActive: true,
      emailVerified: true,
      mustChangePassword: true,
      facilityId: null,
      permissions: ["clinics", "users", "cards", "plans", "finance", "audit_log"],
    },
  });

  console.log("platform admin created successfully.");
  console.log("the account requires a password change on first login.");
}

main()
  .catch((e) => {
    console.error("seed failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
