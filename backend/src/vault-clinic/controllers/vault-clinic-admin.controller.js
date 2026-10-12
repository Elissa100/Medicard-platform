import {
  listVaultClinics,
  registerVaultClinic,
  updateVaultClinicStatus,
  getVaultClinicDetails,
} from "../services/vault-clinic-admin.service.js";

export async function getClinics(req, res) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await listVaultClinics({
      search,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to list vault clinics",
    });
  }
}

export async function createClinic(req, res) {
  try {
    const {
      name,
      code,
      phone,
      email,
      address,
      adminName,
      adminEmail,
      adminPhone,
      bookingMode,
      operatingHours,
      initialServices,
    } = req.body;

    const result = await registerVaultClinic({
      name,
      code,
      phone,
      email,
      address,
      adminName,
      adminEmail,
      adminPhone,
      bookingMode,
      operatingHours,
      initialServices,
    });

    return res.status(201).json({
      success: true,
      message: "Vault clinic created successfully and invitation email dispatched to administrator",
      data: result,
    });
  } catch (error) {
    if (error.code === "P2002" || error.message?.includes("Unique constraint failed")) {
      return res.status(409).json({
        success: false,
        message: "A facility or staff member with this code or email already exists. Please choose a different code or email.",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to register vault clinic",
    });
  }
}

export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required (ACTIVE, SUSPENDED, or INVITED)",
      });
    }

    const updated = await updateVaultClinicStatus(id, status);
    return res.status(200).json({
      success: true,
      message: `Vault clinic status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update vault clinic status",
    });
  }
}

export async function getClinicDetail(req, res) {
  try {
    const { id } = req.params;
    const clinic = await getVaultClinicDetails(id);
    return res.status(200).json({
      success: true,
      data: clinic,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Vault clinic not found",
    });
  }
}
