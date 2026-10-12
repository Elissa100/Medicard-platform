import bcrypt from "bcryptjs";
import prisma from "../../config/database.js";
import {
  generateSecureTemporaryPassword,
  sendStaffInvitationEmail,
} from "./vault-clinic-email.service.js";

export async function listVaultClinics({ search, status, page = 1, limit = 20 }) {
  const where = {
    vaultSettings: status ? { status } : { isNot: null },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [total, facilities] = await Promise.all([
    prisma.facility.count({ where }),
    prisma.facility.findMany({
      where,
      skip,
      take: limit,
      include: {
        vaultSettings: true,
        _count: {
          select: {
            vaultStaff: true,
            vaultServices: true,
            appointments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    clinics: facilities.map((f) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      phone: f.phone,
      email: f.email,
      address: f.address,
      vaultStatus: f.vaultSettings?.status || "INVITED",
      bookingMode: f.vaultSettings?.bookingMode || "MANUAL",
      operatingHours: f.vaultSettings?.operatingHours,
      staffCount: f._count.vaultStaff,
      servicesCount: f._count.vaultServices,
      appointmentsCount: f._count.appointments,
      createdAt: f.createdAt,
    })),
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
}

export async function registerVaultClinic({
  name,
  code,
  phone,
  email,
  address,
  adminName,
  adminEmail,
  adminPhone,
  bookingMode = "MANUAL",
  operatingHours = "Mon - Fri: 08:00 AM - 05:00 PM",
  initialServices = [],
}) {
  const cleanAdminEmail = (adminEmail || "").trim().toLowerCase();
  const cleanCode = (code || "").trim().toUpperCase();
  const cleanName = (name || "").trim();

  if (!cleanName || !cleanCode || !adminName || !cleanAdminEmail) {
    throw new Error("Clinic name, unique code, admin full name, and admin email are required.");
  }

  const existingStaff = await prisma.vaultClinicStaff.findUnique({
    where: { email: cleanAdminEmail },
  });
  if (existingStaff) {
    throw new Error(`A vault clinic staff account already exists with email ${cleanAdminEmail}`);
  }

  const temporaryPassword = generateSecureTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    let facility = await tx.facility.findUnique({
      where: { code: cleanCode },
    });

    if (!facility) {
      facility = await tx.facility.create({
        data: {
          name: cleanName,
          code: cleanCode,
          phone: phone || null,
          email: email || null,
          address: address || null,
          status: "ACTIVE",
        },
      });
    }

    const existingSettings = await tx.vaultClinicSettings.findUnique({
      where: { facilityId: facility.id },
    });

    let vaultSettings;
    if (existingSettings) {
      vaultSettings = await tx.vaultClinicSettings.update({
        where: { facilityId: facility.id },
        data: {
          status: "ACTIVE",
          bookingMode,
          operatingHours,
        },
      });
    } else {
      vaultSettings = await tx.vaultClinicSettings.create({
        data: {
          facilityId: facility.id,
          status: "ACTIVE",
          bookingMode,
          operatingHours,
          slotDurationMinutes: 30,
        },
      });
    }

    const adminStaff = await tx.vaultClinicStaff.create({
      data: {
        facilityId: facility.id,
        name: adminName.trim(),
        email: cleanAdminEmail,
        phone: adminPhone || null,
        role: "CLINIC_ADMIN",
        passwordHash,
        mustChangePassword: true,
        isActive: true,
      },
    });

    const defaultServices = initialServices.length > 0
      ? initialServices
      : [
          { name: "General Consultation", durationMinutes: 30 },
          { name: "Preventive Screening", durationMinutes: 30 },
        ];

    for (const service of defaultServices) {
      await tx.vaultClinicService.create({
        data: {
          facilityId: facility.id,
          name: typeof service === "string" ? service : service.name,
          durationMinutes: typeof service === "object" && service.durationMinutes ? service.durationMinutes : 30,
          price: typeof service === "object" ? service.price || null : null,
          isActive: true,
        },
      });
    }

    return {
      facility,
      vaultSettings,
      adminStaff,
    };
  });

  const emailResult = await sendStaffInvitationEmail({
    to: cleanAdminEmail,
    staffName: adminName,
    clinicName: cleanName,
    role: "Clinic Administrator",
    temporaryPassword,
  });

  return {
    facility: result.facility,
    vaultSettings: result.vaultSettings,
    adminStaff: {
      id: result.adminStaff.id,
      name: result.adminStaff.name,
      email: result.adminStaff.email,
      role: result.adminStaff.role,
    },
    emailDispatched: emailResult.success,
  };
}

export async function updateVaultClinicStatus(facilityId, status) {
  const allowed = ["ACTIVE", "SUSPENDED", "INVITED"];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status. Allowed values: ${allowed.join(", ")}`);
  }

  const updated = await prisma.vaultClinicSettings.update({
    where: { facilityId },
    data: { status },
  });

  return updated;
}

export async function getVaultClinicDetails(facilityId) {
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      vaultSettings: true,
      vaultServices: true,
      vaultStaff: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!facility) {
    throw new Error("Clinic not found");
  }

  return facility;
}
