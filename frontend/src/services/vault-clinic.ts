const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";

export const VAULT_CLINIC_TOKEN_KEY = "medcard_vault_clinic_token";
export const VAULT_CLINIC_STAFF_KEY = "medcard_vault_clinic_staff";

export interface VaultStaffSession {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "CLINIC_ADMIN" | "RECEPTIONIST" | "CLINICIAN";
  mustChangePassword: boolean;
  facility: {
    id: string;
    name: string;
    code: string;
    status: "INVITED" | "ACTIVE" | "SUSPENDED";
    bookingMode: "MANUAL" | "AUTOMATIC";
    operatingHours?: string | null;
    slotDurationMinutes?: number;
  };
}

export function getVaultClinicToken(): string | null {
  return localStorage.getItem(VAULT_CLINIC_TOKEN_KEY);
}

export function getVaultClinicStaff(): VaultStaffSession | null {
  try {
    const raw = localStorage.getItem(VAULT_CLINIC_STAFF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setVaultClinicSession(token: string, staff: VaultStaffSession): void {
  localStorage.setItem(VAULT_CLINIC_TOKEN_KEY, token);
  localStorage.setItem(VAULT_CLINIC_STAFF_KEY, JSON.stringify(staff));
}

export function clearVaultClinicSession(): void {
  localStorage.removeItem(VAULT_CLINIC_TOKEN_KEY);
  localStorage.removeItem(VAULT_CLINIC_STAFF_KEY);
}

export async function vaultClinicFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getVaultClinicToken();

  const isPublicAuth = endpoint.startsWith("/auth/login");
  if (!token && !isPublicAuth) {
    clearVaultClinicSession();
    window.location.href = "/vault-clinic/login";
    throw new Error("Authentication required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/vault-clinic${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !isPublicAuth) {
    clearVaultClinicSession();
    window.location.href = "/vault-clinic/login";
    throw new Error("Session expired. Please sign in again.");
  }

  const data = await response.json();

  if (response.status === 403 && data.code === "PASSWORD_CHANGE_REQUIRED") {
    window.location.href = "/vault-clinic/change-password";
    throw new Error("Initial password change is required.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Request failed");
  }

  return data.data;
}

// Auth endpoints
export async function vaultClinicLogin(email: string, password: string) {
  const result = await vaultClinicFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (result.token && result.staff) {
    setVaultClinicSession(result.token, result.staff);
  }
  return result;
}

export async function vaultClinicChangePassword(currentPassword: string, newPassword: string) {
  const result = await vaultClinicFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const currentStaff = getVaultClinicStaff();
  if (currentStaff) {
    currentStaff.mustChangePassword = false;
    localStorage.setItem(VAULT_CLINIC_STAFF_KEY, JSON.stringify(currentStaff));
  }
  return result;
}

export async function vaultClinicGetMe() {
  return vaultClinicFetch("/auth/me");
}

export async function vaultClinicLogout() {
  try {
    await vaultClinicFetch("/auth/logout", { method: "POST" });
  } finally {
    clearVaultClinicSession();
  }
}

// Management endpoints (CLINIC_ADMIN)
export async function fetchClinicSettings() {
  return vaultClinicFetch("/management/settings");
}

export async function updateClinicSettings(payload: {
  bookingMode?: "MANUAL" | "AUTOMATIC";
  operatingHours?: string;
  slotDurationMinutes?: number;
  notificationEmail?: string;
  notificationPhone?: string;
}) {
  return vaultClinicFetch("/management/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchClinicServices() {
  return vaultClinicFetch("/management/services");
}

export async function createClinicService(payload: {
  name: string;
  code?: string;
  durationMinutes: number;
  price?: number;
}) {
  return vaultClinicFetch("/management/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function toggleClinicService(serviceId: string, isActive: boolean) {
  return vaultClinicFetch(`/management/services/${serviceId}/toggle`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchClinicStaff() {
  return vaultClinicFetch("/management/staff");
}

export async function inviteClinicStaff(payload: {
  name: string;
  email: string;
  phone?: string;
  role: "RECEPTIONIST" | "CLINICIAN" | "CLINIC_ADMIN";
}) {
  return vaultClinicFetch("/management/staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function toggleClinicStaff(staffId: string, isActive: boolean) {
  return vaultClinicFetch(`/management/staff/${staffId}/toggle`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

