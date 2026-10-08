import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("🌱 Starting seed...");

  // Create facility
  const facility = await prisma.facility.upsert({
    where: { code: "KFH" },
    update: {},
    create: {
      code: "KFH",
      name: "King Faisal Hospital",
      email: "admin@kfh.rw",
      phone: "+250 788 123 456",
      address: "Kigali, Rwanda",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Facility created: ${facility.name}`);

  // Hash password for all users
  const password = await hashPassword("password123");

  // Create users for each role
  const roles = [
    { role: "HOSPITAL_ADMIN", email: "admin@kfh.rw", firstName: "Admin", lastName: "User" },
    { role: "DOCTOR", email: "doctor@kfh.rw", firstName: "Jean", lastName: "Niyonzima" },
    { role: "NURSE", email: "nurse@kfh.rw", firstName: "Marie", lastName: "Uwimana" },
    { role: "RECEPTIONIST", email: "reception@kfh.rw", firstName: "Claude", lastName: "Mugisha" },
    { role: "PHARMACIST", email: "pharmacy@kfh.rw", firstName: "Emmanuel", lastName: "Habimana" },
    { role: "LABORATORY", email: "lab@kfh.rw", firstName: "Alice", lastName: "Kagame" },
    { role: "RADIOLOGY", email: "radiology@kfh.rw", firstName: "Patrick", lastName: "Nsengiyumva" },
    { role: "CASHIER", email: "cashier@kfh.rw", firstName: "Grace", lastName: "Mukandayisenga" },
  ];

  for (const roleData of roles) {
    const user = await prisma.user.upsert({
      where: { email: roleData.email },
      update: { passwordHash: password },
      create: {
        email: roleData.email,
        passwordHash: password,
        firstName: roleData.firstName,
        lastName: roleData.lastName,
        role: roleData.role,
        facilityId: facility.id,
        isActive: true,
      },
    });

    console.log(`✅ User created: ${roleData.role} - ${roleData.email}`);
  }

  // Create test patients
  const patientPassword = await hashPassword("patient123");

  const patients = [
    {
      patientNumber: "MC-2026-0811",
      firstName: "Alice",
      lastName: "Mutoni",
      email: "alice.mutoni@example.com",
      phone: "+250 788 123 456",
      nationalId: "1 1995 7 0048291 0 42",
      dateOfBirth: new Date("1995-07-15"),
      gender: "FEMALE",
    },
    {
      patientNumber: "MC-2026-0812",
      firstName: "Jean",
      lastName: "Mugabo",
      email: "jean.mugabo@example.com",
      phone: "+250 788 234 567",
      nationalId: "1 1990 3 0123456 7 89",
      dateOfBirth: new Date("1990-03-20"),
      gender: "MALE",
    },
  ];

  for (const patientData of patients) {
    const patient = await prisma.patient.upsert({
      where: { patientNumber: patientData.patientNumber },
      update: { nationalId: patientPassword }, // Store password hash in nationalId for demo
      create: {
        ...patientData,
        nationalId: patientPassword, // Store password hash in nationalId for demo
      },
    });

    console.log(`✅ Patient created: ${patient.firstName} ${patient.lastName} (${patient.patientNumber})`);
  }

  console.log("🎉 Seed completed!");
  console.log("\n📝 Test Credentials:");
  console.log("\n🏥 Facility Login:");
  console.log("   Email: admin@kfh.rw");
  console.log("   Password: password123");
  console.log("\n👨‍⚕️ Staff Login (use any role):");
  console.log("   Doctor: doctor@kfh.rw / password123");
  console.log("   Nurse: nurse@kfh.rw / password123");
  console.log("   Reception: reception@kfh.rw / password123");
  console.log("   Pharmacy: pharmacy@kfh.rw / password123");
  console.log("   Laboratory: lab@kfh.rw / password123");
  console.log("   Cashier: cashier@kfh.rw / password123");
  console.log("\n👤 Patient Vault Login:");
  console.log("   Alice: alice.mutoni@example.com / patient123");
  console.log("   Jean: jean.mugabo@example.com / patient123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
