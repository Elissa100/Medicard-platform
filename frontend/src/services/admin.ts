const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";

export const ADMIN_TOKEN_KEY = "medcard_admin_token";
export const ADMIN_DATA_KEY = "medcard_admin_data";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminData() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_DATA_KEY) || "{}");
  } catch {
    return {};
  }
}

async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAdminToken();

  if (!token) {
    window.location.href = "/admin/login";
    throw new Error("Not authenticated");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}/admin${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    window.location.href = "/admin/login";
    throw new Error("Session expired. Please sign in again.");
  }

  const data = await response.json();

  if (response.status === 403 && data.mustChangePassword) {
    window.location.href = "/admin/change-password";
    throw new Error("Password change required.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Admin request failed");
  }

  return data.data;
}

export async function fetchOverview() {
  return adminFetch("/overview");
}

export async function fetchClinics() {
  return adminFetch("/clinics");
}

export async function createClinic(clinicData: {
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  return adminFetch("/clinics", {
    method: "POST",
    body: JSON.stringify(clinicData),
  });
}

export async function updateClinicStatus(clinicId: string, status: "ACTIVE" | "INACTIVE") {
  return adminFetch(`/clinics/${clinicId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchUsers(params: { search?: string; role?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  return adminFetch(`/users?${query.toString()}`);
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  return adminFetch(`/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchCards(params: { search?: string; status?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  return adminFetch(`/cards?${query.toString()}`);
}

export async function linkCard(cardUid: string, patientIdentifier: string) {
  return adminFetch("/cards/link", {
    method: "POST",
    body: JSON.stringify({ cardUid, patientIdentifier }),
  });
}

export async function updateCardStatus(cardUid: string, status: string) {
  return adminFetch(`/cards/${cardUid}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchPlans() {
  return adminFetch("/plans");
}

export async function fetchFinanceOverview() {
  return adminFetch("/finance/overview");
}

export async function fetchFinanceTransactions(params: {
  search?: string;
  status?: string;
  plan?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") query.set(k, String(v));
  });

  return adminFetch(`/finance/transactions?${query.toString()}`);
}

export async function fetchFinanceTransactionDetail(id: string) {
  return adminFetch(`/finance/transactions/${id}`);
}

export async function downloadFinanceExport(params: Record<string, string> = {}) {
  const token = getAdminToken();
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/admin/finance/transactions/export?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Export download failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `medcard-finance-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchAuditLogs(params: { search?: string; action?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.action) query.set("action", params.action);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  return adminFetch(`/audit-logs?${query.toString()}`);
}
