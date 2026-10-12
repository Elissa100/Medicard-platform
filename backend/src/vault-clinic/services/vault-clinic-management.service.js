import bcrypt from "bcryptjs";
import prisma from "../../config/database.js";
import {
  generateSecureTemporaryPassword,
  sendStaffInvitationEmail,
} from "./vault-clinic-email.service.js";

export async function getClinicSettings(facilityId) {
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      vaultSettings: true,
      vaultServices: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!facility) {
    throw new Error("Facility not found");
  }

  return {
    facility: {
      id: facility.id,
      name: facility.name,
      code: facility.code,
      phone: facility.phone,
      email: facility.email,
      address: facility.address,
    },
    settings: facility.vaultSettings,
    services: facility.vaultServices,
  };
}

export async function updateClinicSettings(facilityId, staffId, { bookingMode, operatingHours, slotDurationMinutes, notificationEmail, notificationPhone, ipAddress, userAgent }) {
  const data = {};
  if (bookingMode) data.bookingMode = bookingMode;
  if (operatingHours !== undefined) data.operatingHours = operatingHours;
  if (slotDurationMinutes) data.slotDurationMinutes = Number(slotDurationMinutes);
  if (notificationEmail !== undefined) data.notificationEmail = notificationEmail;
  if (notificationPhone !== undefined) data.notificationPhone = notificationPhone;

  const updated = await prisma.vaultClinicSettings.upsert({
    where: { facilityId },
    update: data,
    create: {
      facilityId,
      status: "ACTIVE",
      ...data,
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId,
      action: "SETTINGS_UPDATED",
      entityType: "VaultClinicSettings",
      entityId: updated.id,
      details: data,
      ipAddress,
      userAgent,
    },
  });

  return updated;
}

export async function listClinicServices(facilityId) {
  return prisma.vaultClinicService.findMany({
    where: { facilityId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createClinicService(facilityId, staffId, { name, code, durationMinutes = 30, price, currency = "RWF", ipAddress, userAgent }) {
  if (!name || !name.trim()) {
    throw new Error("Service name is required");
  }

  const service = await prisma.vaultClinicService.create({
    data: {
      facilityId,
      name: name.trim(),
      code: code ? code.trim() : null,
      durationMinutes: Number(durationMinutes) || 30,
      price: price !== undefined && price !== "" ? Number(price) : null,
      currency,
      isActive: true,
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId,
      action: "SERVICE_CREATED",
      entityType: "VaultClinicService",
      entityId: service.id,
      details: { name: service.name, durationMinutes: service.durationMinutes, price: service.price },
      ipAddress,
      userAgent,
    },
  });

  return service;
}

export async function toggleClinicService(facilityId, staffId, serviceId, isActive, { ipAddress, userAgent } = {}) {
  const service = await prisma.vaultClinicService.findFirst({
    where: { id: serviceId, facilityId },
  });

  if (!service) {
    throw new Error("Service not found in this clinic");
  }

  const updated = await prisma.vaultClinicService.update({
    where: { id: serviceId },
    data: { isActive },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId,
      action: isActive ? "SERVICE_ACTIVATED" : "SERVICE_DEACTIVATED",
      entityType: "VaultClinicService",
      entityId: service.id,
      details: { isActive },
      ipAddress,
      userAgent,
    },
  });

  return updated;
}

export async function listClinicStaff(facilityId) {
  return prisma.vaultClinicStaff.findMany({
    where: { facilityId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function inviteClinicStaff(facilityId, inviterStaffId, { name, email, phone, role, ipAddress, userAgent }) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanName = (name || "").trim();

  if (!cleanName || !cleanEmail || !role) {
    throw new Error("Staff name, email, and role are required");
  }

  const allowedRoles = ["RECEPTIONIST", "CLINICIAN", "CLINIC_ADMIN"];
  if (!allowedRoles.includes(role)) {
    throw new Error(`Invalid role. Allowed roles: ${allowedRoles.join(", ")}`);
  }

  const existing = await prisma.vaultClinicStaff.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    throw new Error(`A staff member with email ${cleanEmail} already exists`);
  }

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  const temporaryPassword = generateSecureTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const staff = await prisma.vaultClinicStaff.create({
    data: {
      facilityId,
      name: cleanName,
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      role,
      passwordHash,
      mustChangePassword: true,
      isActive: true,
    },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: inviterStaffId,
      action: "STAFF_INVITED",
      entityType: "VaultClinicStaff",
      entityId: staff.id,
      details: { role, email: cleanEmail, name: cleanName },
      ipAddress,
      userAgent,
    },
  });

  const emailResult = await sendStaffInvitationEmail({
    to: cleanEmail,
    staffName: cleanName,
    clinicName: facility?.name || "Clinic",
    role: role === "CLINICIAN" ? "Clinician / Doctor" : role === "RECEPTIONIST" ? "Receptionist" : "Clinic Admin",
    temporaryPassword,
  });

  return {
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    },
    emailDispatched: emailResult.success,
  };
}

export async function toggleStaffActive(facilityId, currentStaffId, targetStaffId, isActive, { ipAddress, userAgent } = {}) {
  if (currentStaffId === targetStaffId && !isActive) {
    throw new Error("You cannot disable your own staff account");
  }

  const staff = await prisma.vaultClinicStaff.findFirst({
    where: { id: targetStaffId, facilityId },
  });

  if (!staff) {
    throw new Error("Staff member not found in this clinic");
  }

  const updated = await prisma.vaultClinicStaff.update({
    where: { id: targetStaffId },
    data: { isActive },
  });

  await prisma.vaultAuditLog.create({
    data: {
      facilityId,
      staffId: currentStaffId,
      action: isActive ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED",
      entityType: "VaultClinicStaff",
      entityId: targetStaffId,
      details: { isActive },
      ipAddress,
      userAgent,
    },
  });

  return updated;
}

