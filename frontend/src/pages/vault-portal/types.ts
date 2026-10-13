
export type TabId =
  | "overview"
  | "appointments"
  | "history"
  | "consultations"
  | "prescriptions"
  | "documents"
  | "notifications"
  | "family"
  | "profile"
  | "billing";

export type HealthRecord = {
  id: string;
  allergen?: string;
  reaction?: string | null;
  severity?: string | null;
  name?: string;
  description?: string | null;
  createdAt: string;
};

export type VaultProfile = {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  dateOfBirth: string | null;
  gender: string;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  insuranceProvider: string | null;
  allergies: HealthRecord[];
  medicalConditions: HealthRecord[];
  medicalDocuments: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    mimeType: string | null;
    createdAt: string;
  }>;
  patientInsurances: Array<{
    id: string;
    membershipNumber: string;
    status: string;
    plan: { name: string; provider: { name: string } };
  }>;
  dependents?: VaultProfile[];
};

export type VaultSubscription = {
  plan: "BASIC" | "PREMIUM";
  status: string;
  endDate: string | null;
  amount: number;
};

export type DashboardData = {
  patient: VaultProfile;
  subscription: VaultSubscription | null;
};

export type EditableProfile = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  nationalId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
};

export type Consultation = {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  facility: { id: string; name: string };
  provider: { firstName: string; lastName: string; role: string };
  clinicalNotes: Array<{
    id: string;
    subjective: string | null;
    assessment: string | null;
    plan: string | null;
    createdAt: string;
  }>;
  diagnoses: Array<{
    id: string;
    code: string | null;
    description: string;
    diagnosisType: string;
    createdAt: string;
  }>;
};

export type Prescription = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  prescribedBy: { firstName: string; lastName: string; role: string };
  encounter?: {
    startedAt: string;
    facility?: { name: string };
  };
  items: Array<{
    id: string;
    medicationName: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    quantity: string | null;
    instructions: string | null;
  }>;
};

export type LabResultItem = {
  id: string;
  status: string;
  clinicalIndication: string | null;
  requestedAt: string;
  completedAt: string | null;
  requestedBy: { firstName: string; lastName: string; role: string };
  encounter?: {
    startedAt: string;
    facility?: { name: string };
  };
  tests: Array<{ id: string; testName: string; testCode: string | null }>;
  results: Array<{
    id: string;
    testName: string;
    resultValue: string | null;
    unit: string | null;
    referenceRange: string | null;
    interpretation: string | null;
    status: string;
    resultDate: string | null;
  }>;
};

export type ParticipatingClinic = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  services: string[];
  operatingHours: string;
};

export type PatientAppointment = {
  id: string;
  patientId: string;
  facilityId: string;
  appointmentType: string;
  status: "SCHEDULED" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  scheduledAt: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  facility: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
  };
  provider?: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
};

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not provided";
  try {
    return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not scheduled";
  try {
    return new Intl.DateTimeFormat("en-RW", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function isPlaceholderName(firstName?: string | null, lastName?: string | null, email?: string | null): boolean {
  if (!firstName || !firstName.trim()) return true;
  const f = firstName.trim().toLowerCase();
  const l = (lastName || "").trim().toLowerCase();
  if (f === "patient" && (l === "user" || !l)) return true;
  if (email) {
    const prefix = email.split("@")[0].toLowerCase();
    if (f === prefix || `${f} ${l}`.trim() === prefix) return true;
  }
  return false;
}

