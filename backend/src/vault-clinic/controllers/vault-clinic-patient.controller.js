import {
  lookupPatient,
  getPatientVaultClinicalData,
  simulateMockCardTap,
  listFacilityGrants,
  revokeAccessGrant,
} from "../services/vault-clinic-patient.service.js";

function getMeta(req) {
  return {
    ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
}

export async function searchPatients(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const meta = getMeta(req);
    const result = await lookupPatient(
      req.vaultStaff.facilityId,
      req.vaultStaff,
      query,
      meta
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getPatientVault(req, res) {
  try {
    const { patientId } = req.params;
    const meta = getMeta(req);
    const result = await getPatientVaultClinicalData(
      req.vaultStaff.facilityId,
      patientId,
      req.vaultStaff,
      meta
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Failed to retrieve clinical vault records",
    });
  }
}

export async function mockCardTap(req, res) {
  try {
    const { patientId } = req.params;
    const meta = getMeta(req);
    const grant = await simulateMockCardTap(
      req.vaultStaff.facilityId,
      patientId,
      req.vaultStaff,
      meta
    );

    return res.status(201).json({
      success: true,
      message: "Card tap simulated successfully: 24-hour consent grant created",
      data: grant,
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Failed to simulate card tap",
    });
  }
}

export async function getGrants(req, res) {
  try {
    const grants = await listFacilityGrants(req.vaultStaff.facilityId);
    return res.status(200).json({
      success: true,
      data: grants,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function revokeGrant(req, res) {
  try {
    const { grantId } = req.params;
    const { reason } = req.body;
    const meta = getMeta(req);
    const updated = await revokeAccessGrant(
      req.vaultStaff.facilityId,
      grantId,
      req.vaultStaff,
      reason,
      meta
    );

    return res.status(200).json({
      success: true,
      message: "Consent access grant revoked",
      data: updated,
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Failed to revoke grant",
    });
  }
}

