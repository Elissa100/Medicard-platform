import {
  getClinicSettings,
  updateClinicSettings,
  listClinicServices,
  createClinicService,
  toggleClinicService,
  listClinicStaff,
  inviteClinicStaff,
  toggleStaffActive,
} from "../services/vault-clinic-management.service.js";

function getClientMeta(req) {
  return {
    ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
}

export async function getSettings(req, res) {
  try {
    const data = await getClinicSettings(req.vaultStaff.facilityId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const meta = getClientMeta(req);
    const updated = await updateClinicSettings(
      req.vaultStaff.facilityId,
      req.vaultStaff.id,
      {
        ...req.body,
        ...meta,
      }
    );
    return res.status(200).json({
      success: true,
      message: "Clinic settings updated successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getServices(req, res) {
  try {
    const services = await listClinicServices(req.vaultStaff.facilityId);
    return res.status(200).json({ success: true, data: services });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function addService(req, res) {
  try {
    const meta = getClientMeta(req);
    const service = await createClinicService(
      req.vaultStaff.facilityId,
      req.vaultStaff.id,
      {
        ...req.body,
        ...meta,
      }
    );
    return res.status(201).json({
      success: true,
      message: "Service added successfully",
      data: service,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function toggleService(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const meta = getClientMeta(req);
    const updated = await toggleClinicService(
      req.vaultStaff.facilityId,
      req.vaultStaff.id,
      id,
      Boolean(isActive),
      meta
    );
    return res.status(200).json({
      success: true,
      message: `Service ${isActive ? "activated" : "deactivated"}`,
      data: updated,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getStaff(req, res) {
  try {
    const staff = await listClinicStaff(req.vaultStaff.facilityId);
    return res.status(200).json({ success: true, data: staff });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function inviteStaff(req, res) {
  try {
    const meta = getClientMeta(req);
    const result = await inviteClinicStaff(
      req.vaultStaff.facilityId,
      req.vaultStaff.id,
      {
        ...req.body,
        ...meta,
      }
    );
    return res.status(201).json({
      success: true,
      message: "Staff member invited successfully and credentials dispatched via email",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function toggleStaff(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const meta = getClientMeta(req);
    const updated = await toggleStaffActive(
      req.vaultStaff.facilityId,
      req.vaultStaff.id,
      id,
      Boolean(isActive),
      meta
    );
    return res.status(200).json({
      success: true,
      message: `Staff member account ${isActive ? "activated" : "disabled"}`,
      data: updated,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}
