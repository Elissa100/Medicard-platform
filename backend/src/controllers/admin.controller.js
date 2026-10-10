import * as adminService from "../services/admin.service.js";

function getContext(req) {
  return {
    ipAddress: req.ip || req.headers["x-forwarded-for"],
    userAgent: req.headers["user-agent"],
  };
}

export async function getOverview(req, res) {
  try {
    const data = await adminService.getOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getClinics(req, res) {
  try {
    const data = await adminService.getClinics();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateClinicStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const data = await adminService.updateClinicStatus(id, status, req.user, getContext(req));
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function createClinic(req, res) {
  try {
    const { name, code, phone, email, address } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Name and code are required" });
    }

    const data = await adminService.createClinic({ name, code, phone, email, address }, req.user, getContext(req));
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getUsers(req, res) {
  try {
    const { search, role, page, limit } = req.query;
    const data = await adminService.getUsers({ search, role, page, limit });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive boolean is required" });
    }

    const data = await adminService.updateUserStatus(id, isActive, req.user, getContext(req));
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getCards(req, res) {
  try {
    const { search, status, page, limit } = req.query;
    const data = await adminService.getCards({ search, status, page, limit });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function linkCard(req, res) {
  try {
    const { cardUid, patientIdentifier } = req.body;

    if (!cardUid || !patientIdentifier) {
      return res.status(400).json({ success: false, message: "cardUid and patientIdentifier are required" });
    }

    const data = await adminService.linkCard({ cardUid, patientIdentifier }, req.user, getContext(req));
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function updateCardStatus(req, res) {
  try {
    const { cardUid } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "BLOCKED", "LOST", "EXPIRED", "REPLACED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid card status" });
    }

    const data = await adminService.updateCardStatus(cardUid, status, req.user, getContext(req));
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getPlans(req, res) {
  try {
    const data = await adminService.getPlans();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getFinanceOverview(req, res) {
  try {
    const data = await adminService.getFinanceOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getFinanceTransactions(req, res) {
  try {
    const data = await adminService.getFinanceTransactions(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getFinanceTransactionDetail(req, res) {
  try {
    const { id } = req.params;
    const data = await adminService.getFinanceTransactionDetail(id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
}

export async function exportFinanceTransactions(req, res) {
  try {
    const csvContent = await adminService.exportFinanceTransactions(req.query, req.user, getContext(req));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=medcard-finance-export-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function withdrawFunds(req, res) {
  try {
    const data = await adminService.withdrawPlatformFunds(req.body, req.user, getContext(req));
    res.json({ success: true, data, message: "Withdrawal initiated successfully" });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const data = await adminService.getAuditLogs(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

