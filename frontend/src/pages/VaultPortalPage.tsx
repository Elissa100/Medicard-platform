import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { VAULT_PLANS } from "../config/plans";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const AUTH_TOKEN_KEY = "medcard_auth_token";

type TabId =
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

type HealthRecord = {
  id: string;
  allergen?: string;
  reaction?: string | null;
  severity?: string | null;
  name?: string;
  description?: string | null;
  createdAt: string;
};

type VaultProfile = {
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

type VaultSubscription = {
  plan: "BASIC" | "PREMIUM";
  status: string;
  endDate: string | null;
  amount: number;
};

type DashboardData = {
  patient: VaultProfile;
  subscription: VaultSubscription | null;
};

type EditableProfile = {
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

type Consultation = {
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

type Prescription = {
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

type LabResultItem = {
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

type ParticipatingClinic = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  services: string[];
  operatingHours: string;
};

type PatientAppointment = {
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

const emptyDependent = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "UNKNOWN",
  nationalId: "",
  insuranceProvider: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";
  try {
    return new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatDateTime(value: string | null | undefined) {
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

export default function VaultPortalPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [appointmentSubTab, setAppointmentSubTab] = useState<"upcoming" | "past" | "find">("upcoming");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [profileForm, setProfileForm] = useState<EditableProfile | null>(null);

  // Clinical records
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labResults, setLabResults] = useState<LabResultItem[]>([]);

  // Clinic Directory & Appointments state
  const [clinics, setClinics] = useState<ParticipatingClinic[]>([]);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [clinicSearch, setClinicSearch] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingFacilityId, setBookingFacilityId] = useState("");
  const [bookingService, setBookingService] = useState("General Consultation");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingReason, setBookingReason] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);

  // Health record addition modal/forms
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [allergyName, setAllergyName] = useState("");
  const [allergyReaction, setAllergyReaction] = useState("");
  const allergySeverity = "MILD";

  const [showConditionModal, setShowConditionModal] = useState(false);
  const [conditionName, setConditionName] = useState("");
  const [conditionDescription, setConditionDescription] = useState("");

  const [showDependentModal, setShowDependentModal] = useState(false);
  const [dependentForm, setDependentForm] = useState(emptyDependent);

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  const getHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchClinicalRecords = useCallback(
    async (profileId: string) => {
      if (!token) return;
      try {
        const [cRes, pRes, lRes] = await Promise.all([
          fetch(`${API_URL}/vault/consultations?profileId=${profileId}`, { headers: getHeaders() }),
          fetch(`${API_URL}/vault/prescriptions?profileId=${profileId}`, { headers: getHeaders() }),
          fetch(`${API_URL}/vault/lab-results?profileId=${profileId}`, { headers: getHeaders() }),
        ]);

        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.success) setConsultations(cData.data);
        }
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success) setPrescriptions(pData.data);
        }
        if (lRes.ok) {
          const lData = await lRes.json();
          if (lData.success) setLabResults(lData.data);
        }
      } catch (err) {
        console.error("Failed to load clinical records:", err);
      }
    },
    [token, getHeaders]
  );

  const fetchClinicsAndAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const [clinicsRes, apptRes] = await Promise.all([
        fetch(`${API_URL}/vault/clinics`, { headers: getHeaders() }),
        fetch(`${API_URL}/vault/appointments`, { headers: getHeaders() }),
      ]);

      if (clinicsRes.ok) {
        const cData = await clinicsRes.json();
        if (cData.success) setClinics(cData.data);
      }
      if (apptRes.ok) {
        const aData = await apptRes.json();
        if (aData.success) setAppointments(aData.data);
      }
    } catch (err) {
      console.error("Failed to load clinics or appointments:", err);
    }
  }, [token, getHeaders]);

  const fetchDashboard = useCallback(async () => {
    if (!token) {
      window.location.assign("/patient-vault/login");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/vault/me`, {
        headers: getHeaders(),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load patient dashboard.");
      }

      setDashboard(result.data);
      setSelectedProfileId((prev) => prev || result.data.patient.id);
      await fetchClinicsAndAppointments();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [token, getHeaders, fetchClinicsAndAppointments]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const selectedProfile = useMemo<VaultProfile | null>(() => {
    if (!dashboard) return null;
    if (dashboard.patient.id === selectedProfileId) return dashboard.patient;
    return dashboard.patient.dependents?.find((d) => d.id === selectedProfileId) || dashboard.patient;
  }, [dashboard, selectedProfileId]);

  useEffect(() => {
    if (selectedProfile) {
      setProfileForm({
        firstName: selectedProfile.firstName || "",
        lastName: selectedProfile.lastName || "",
        dateOfBirth: selectedProfile.dateOfBirth ? selectedProfile.dateOfBirth.slice(0, 10) : "",
        gender: selectedProfile.gender || "UNKNOWN",
        phone: selectedProfile.phone || "",
        nationalId: selectedProfile.nationalId || "",
        emergencyContactName: selectedProfile.emergencyContactName || "",
        emergencyContactPhone: selectedProfile.emergencyContactPhone || "",
        insuranceProvider: selectedProfile.insuranceProvider || "",
      });

      fetchClinicalRecords(selectedProfile.id);
    }
  }, [selectedProfile, fetchClinicalRecords]);

  // Appointment actions
  const handleBookAppointment = async (e: FormEvent) => {
    e.preventDefault();
    if (!bookingFacilityId || !bookingDate || !bookingTime) {
      setError("Please select a clinic, appointment date, and time slot.");
      return;
    }

    setIsSubmittingBooking(true);
    setError("");

    try {
      const scheduledAtIso = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();
      const response = await fetch(`${API_URL}/vault/appointments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          profileId: selectedProfile?.id,
          facilityId: bookingFacilityId,
          appointmentType: bookingService,
          scheduledAt: scheduledAtIso,
          reason: bookingReason,
          notes: bookingNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to book appointment.");
      }

      setNotice("Appointment request submitted successfully. You will receive clinic confirmation.");
      setShowBookingModal(false);
      setBookingReason("");
      setBookingNotes("");
      await fetchClinicsAndAppointments();
      setActiveTab("appointments");
      setAppointmentSubTab("upcoming");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete appointment booking.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled appointment?")) return;

    setCancellingAppointmentId(appointmentId);
    setError("");

    try {
      const response = await fetch(`${API_URL}/vault/appointments/${appointmentId}/cancel`, {
        method: "PATCH",
        headers: getHeaders(),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not cancel appointment.");
      }

      setNotice("Appointment cancelled successfully.");
      await fetchClinicsAndAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel appointment.");
    } finally {
      setCancellingAppointmentId(null);
    }
  };

  // Profile save
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !profileForm) return;

    try {
      setIsSaving(true);
      setError("");
      setNotice("");

      const response = await fetch(`${API_URL}/vault/profiles/${selectedProfile.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(profileForm),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save profile changes.");
      }

      setNotice("Personal profile details updated successfully.");
      await fetchDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  // Health records add/delete
  const addAllergy = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !allergyName.trim()) return;

    try {
      setIsSaving(true);
      setError("");
      const response = await fetch(`${API_URL}/vault/profiles/${selectedProfile.id}/allergies`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          allergen: allergyName.trim(),
          reaction: allergyReaction.trim() || undefined,
          severity: allergySeverity,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to add allergy.");

      setAllergyName("");
      setAllergyReaction("");
      setShowAllergyModal(false);
      setNotice("Allergy recorded successfully.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add allergy.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAllergy = async (allergyId: string) => {
    if (!selectedProfile) return;
    try {
      setIsSaving(true);
      const res = await fetch(`${API_URL}/vault/profiles/${selectedProfile.id}/allergies/${allergyId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not delete allergy.");
      setNotice("Allergy record removed.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting allergy.");
    } finally {
      setIsSaving(false);
    }
  };

  const addCondition = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !conditionName.trim()) return;

    try {
      setIsSaving(true);
      setError("");
      const response = await fetch(`${API_URL}/vault/profiles/${selectedProfile.id}/conditions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: conditionName.trim(),
          description: conditionDescription.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to add condition.");

      setConditionName("");
      setConditionDescription("");
      setShowConditionModal(false);
      setNotice("Medical condition saved successfully.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add condition.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCondition = async (conditionId: string) => {
    if (!selectedProfile) return;
    try {
      setIsSaving(true);
      const res = await fetch(`${API_URL}/vault/profiles/${selectedProfile.id}/conditions/${conditionId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not delete condition.");
      setNotice("Condition record removed.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting condition.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add dependent
  const addDependent = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError("");
      const response = await fetch(`${API_URL}/vault/dependents`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(dependentForm),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed to add family member.");

      setDependentForm(emptyDependent);
      setShowDependentModal(false);
      setNotice("Family member profile created successfully.");
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add family profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Upgrade plan
  const upgradePlan = async () => {
    if (!paymentPhone.trim()) {
      setError("Please enter your Mobile Money phone number.");
      return;
    }

    try {
      setIsPaying(true);
      setError("");
      setNotice("");

      const response = await fetch(`${API_URL}/vault/payment/initiate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          plan: "PREMIUM",
          phone: paymentPhone.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Payment initiation failed.");

      const paymentId = result.data.paymentId;
      for (let i = 0; i < 6; i++) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const check = await fetch(`${API_URL}/vault/payment/${paymentId}/status`, { headers: getHeaders() });
        const checkResult = await check.json();
        if (checkResult.success && checkResult.data.status === "SUCCESS") {
          setNotice("Payment confirmed! Your Premium Vault is now active.");
          await fetchDashboard();
          setIsPaying(false);
          return;
        }
      }

      setNotice("Payment is still processing. Check your plan again shortly.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to process plan payment.");
    } finally {
      setIsPaying(false);
    }
  };

  const filteredClinics = useMemo(() => {
    if (!clinicSearch.trim()) return clinics;
    const q = clinicSearch.toLowerCase();
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        c.services.some((s) => s.toLowerCase().includes(q))
    );
  }, [clinics, clinicSearch]);

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED"),
    [appointments]
  );

  const pastAppointments = useMemo(
    () => appointments.filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW"),
    [appointments]
  );

  const profileOptions = useMemo(() => {
    if (!dashboard) return [];
    const list = [
      {
        id: dashboard.patient.id,
        name: `${dashboard.patient.firstName} ${dashboard.patient.lastName}`,
        isDependent: false,
      },
    ];
    if (dashboard.patient.dependents) {
      dashboard.patient.dependents.forEach((d) => {
        list.push({
          id: d.id,
          name: `${d.firstName} ${d.lastName}`,
          isDependent: true,
        });
      });
    }
    return list;
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#F6F8FA]">
        <div className="text-center">
          <LoaderCircle className="animate-spin text-[#00A3B8] mx-auto mb-3" size={36} />
          <p className="text-[#0F2942] text-sm font-medium">Loading your Patient Vault...</p>
        </div>
      </div>
    );
  }

  if (!dashboard || !selectedProfile || !profileForm) {
    return (
      <main className="h-dvh bg-[#F6F8FA] px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-xl border border-[#E4EBF0] bg-white p-6 text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-[#0F2942]">Patient Vault Unavailable</h1>
          <p className="mt-1.5 text-xs text-[#475B6B]">{error || "We could not load your account session."}</p>
          <button
            onClick={() => window.location.assign("/patient-vault/login")}
            className="mt-5 w-full rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] px-4 py-2.5 text-xs font-semibold text-white transition-colors"
          >
            Sign in again
          </button>
        </div>
      </main>
    );
  }

  const subscription = dashboard.subscription;
  const isPremium = subscription?.plan === "PREMIUM";

  return (
    <AppLayout
      currentRole="patient"
      activeNavId={activeTab}
      onNavSelect={(id) => setActiveTab(id as TabId)}
      userDisplayName={`${dashboard.patient.firstName} ${dashboard.patient.lastName}`}
      userEmail={dashboard.patient.email || undefined}
      profiles={profileOptions}
      selectedProfileId={selectedProfileId}
      onSelectProfileId={(id) => setSelectedProfileId(id)}
      onBookAppointmentClick={() => {
        setActiveTab("appointments");
        setAppointmentSubTab("find");
      }}
      onNotificationsClick={() => setActiveTab("notifications")}
      hasUnreadNotifications={false}
    >
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Status / Notice alerts */}
        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 p-3.5 rounded-xl text-xs border ${
              error
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <div className="flex items-start gap-2">
              {error ? (
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              )}
              <span>{error || notice}</span>
            </div>
            <button
              onClick={() => {
                setError("");
                setNotice("");
              }}
              className="text-xs font-semibold opacity-60 hover:opacity-100 p-0.5"
              aria-label="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: OVERVIEW (Restyled with FIKA calm and density)         */}
        {/* ========================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Stat Cards (4 columns, 4px grid, 16px gap) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Vault Plan */}
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E4EBF0]">
                <div className="flex items-center justify-between text-[#7A8D9B] mb-2">
                  <span className="text-xs font-medium text-[#7A8D9B]">Vault plan</span>
                  <span className="p-1.5 rounded-lg bg-[#EAF3F8] text-[#00A3B8]">
                    <ShieldCheck size={16} />
                  </span>
                </div>
                <div className="text-xl font-semibold text-[#0F2942]">
                  {isPremium ? "Premium" : "Basic"}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#00A3B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00A3B8]" />
                  <span>Active subscription</span>
                </div>
              </div>

              {/* Stat 2: MedCard Patient ID */}
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E4EBF0]">
                <div className="flex items-center justify-between text-[#7A8D9B] mb-2">
                  <span className="text-xs font-medium text-[#7A8D9B]">MedCard patient ID</span>
                  <span className="p-1.5 rounded-lg bg-[#EAF3F8] text-[#0F2942]">
                    <CreditCard size={16} />
                  </span>
                </div>
                <div className="text-lg font-semibold font-mono text-[#0F2942] truncate">
                  {selectedProfile.patientNumber}
                </div>
                <div className="mt-1.5 text-xs text-[#7A8D9B]">
                  Instant clinic tap enabled
                </div>
              </div>

              {/* Stat 3: Allergies & Conditions */}
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E4EBF0]">
                <div className="flex items-center justify-between text-[#7A8D9B] mb-2">
                  <span className="text-xs font-medium text-[#7A8D9B]">Allergies and conditions</span>
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                    <AlertTriangle size={16} />
                  </span>
                </div>
                <div className="text-xl font-semibold text-[#0F2942]">
                  {selectedProfile.allergies.length + selectedProfile.medicalConditions.length}
                </div>
                <div className="mt-1.5 text-xs text-[#7A8D9B]">
                  {selectedProfile.allergies.length} allergies, {selectedProfile.medicalConditions.length} conditions
                </div>
              </div>

              {/* Stat 4: Appointments */}
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E4EBF0]">
                <div className="flex items-center justify-between text-[#7A8D9B] mb-2">
                  <span className="text-xs font-medium text-[#7A8D9B]">Appointments</span>
                  <span className="p-1.5 rounded-lg bg-[#EAF3F8] text-[#2A7AA5]">
                    <Calendar size={16} />
                  </span>
                </div>
                <div className="text-xl font-semibold text-[#0F2942]">
                  {upcomingAppointments.length}
                </div>
                <div className="mt-1.5 text-xs text-[#00A3B8] font-medium">
                  {upcomingAppointments.length > 0 ? "Upcoming visit scheduled" : "No visits queued"}
                </div>
              </div>
            </div>

            {/* Emergency Health Card (Calm white card with subtle pale cyan strip) */}
            <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] border-l-4 border-l-[#00A3B8]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00A3B8]">
                    <ShieldAlert size={15} />
                    <span>Emergency access summary</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F2942]">
                    {selectedProfile.firstName} {selectedProfile.lastName}
                  </h3>
                  <p className="text-xs text-[#475B6B] max-w-xl">
                    This information is immediately retrieved when your NFC card is tapped at participating emergency clinics.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0]">
                      <span className="text-[#7A8D9B] block font-medium">Emergency contact</span>
                      <span className="font-semibold text-[#0F2942] block mt-0.5 truncate">
                        {selectedProfile.emergencyContactName || "Not provided"} ({selectedProfile.emergencyContactPhone || "No phone"})
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0]">
                      <span className="text-[#7A8D9B] block font-medium">Known allergies</span>
                      <span className="font-semibold text-[#0F2942] block mt-0.5 truncate">
                        {selectedProfile.allergies.length > 0
                          ? selectedProfile.allergies.map((a) => a.allergen).join(", ")
                          : "None reported"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0]">
                      <span className="text-[#7A8D9B] block font-medium">Insurance provider</span>
                      <span className="font-semibold text-[#0F2942] block mt-0.5 truncate">
                        {selectedProfile.insuranceProvider || "Direct payer"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-row md:flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="h-9 px-3.5 rounded-lg bg-[#F6F8FA] hover:bg-[#E4EBF0] border border-[#E4EBF0] text-xs font-medium text-[#0F2942] transition-colors"
                  >
                    Update emergency details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("appointments");
                      setAppointmentSubTab("find");
                    }}
                    className="h-9 px-3.5 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold transition-colors"
                  >
                    Book clinic visit
                  </button>
                </div>
              </div>
            </div>

            {/* Grid: Next Appointment & Recent Consultations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Next Scheduled Appointment */}
              <div className="bg-white rounded-xl p-5 border border-[#E4EBF0]">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#EAF3F8] text-[#0F2942]">
                      <Calendar size={15} />
                    </span>
                    <h3 className="text-sm font-semibold text-[#0F2942]">Next scheduled appointment</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("appointments")}
                    className="text-xs text-[#00A3B8] font-medium hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>View all ({appointments.length})</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {upcomingAppointments.length > 0 ? (
                  <div className="p-3.5 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F2942] text-xs">
                        {upcomingAppointments[0].facility.name}
                      </span>
                      <span
                        className={`h-[22px] px-2.5 rounded-full text-xs font-medium flex items-center ${
                          upcomingAppointments[0].status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-amber-50 text-amber-800 border border-amber-200/60"
                        }`}
                      >
                        {upcomingAppointments[0].status === "CONFIRMED" ? "Confirmed" : "Pending confirmation"}
                      </span>
                    </div>
                    <p className="text-xs text-[#475B6B] flex items-center gap-1.5">
                      <Clock size={13} className="text-[#00A3B8]" />
                      <span>{formatDateTime(upcomingAppointments[0].scheduledAt)}</span>
                    </p>
                    {upcomingAppointments[0].reason && (
                      <p className="text-xs text-[#7A8D9B]">
                        Reason: {upcomingAppointments[0].reason}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[#475B6B]">
                    <Calendar size={28} className="mx-auto text-[#7A8D9B]/50 mb-2" />
                    <p className="text-xs font-medium">No upcoming appointments</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("appointments");
                        setAppointmentSubTab("find");
                      }}
                      className="mt-2 text-xs font-semibold text-[#00A3B8] hover:underline"
                    >
                      Book an appointment with a clinic
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Consultations */}
              <div className="bg-white rounded-xl p-5 border border-[#E4EBF0]">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#EAF3F8] text-[#0F2942]">
                      <Stethoscope size={15} />
                    </span>
                    <h3 className="text-sm font-semibold text-[#0F2942]">Recent consultations</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("consultations")}
                    className="text-xs text-[#00A3B8] font-medium hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {consultations.length > 0 ? (
                  <div className="space-y-2.5">
                    {consultations.slice(0, 2).map((c) => (
                      <div key={c.id} className="p-3 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#0F2942]">{c.facility.name}</span>
                          <span className="text-[#7A8D9B]">{formatDate(c.startedAt)}</span>
                        </div>
                        <p className="text-xs text-[#475B6B] mt-1">
                          Dr. {c.provider.firstName} {c.provider.lastName} · {c.type}
                        </p>
                        {c.diagnoses.length > 0 && (
                          <div className="mt-1.5 text-xs text-[#0F2942] bg-white px-2 py-0.5 rounded border border-[#E4EBF0] inline-block font-medium">
                            Diagnosis: {c.diagnoses[0].description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[#475B6B]">
                    <Stethoscope size={28} className="mx-auto text-[#7A8D9B]/50 mb-2" />
                    <p className="text-xs font-medium">No recorded consultations</p>
                    <p className="text-[11px] text-[#7A8D9B] mt-1">
                      Consultations from participating MedCard clinics appear here automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: APPOINTMENTS & CLINIC DIRECTORY                       */}
        {/* ========================================================== */}
        {activeTab === "appointments" && (
          <div className="space-y-5">
            {/* Header + Subtabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4EBF0] pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAppointmentSubTab("upcoming")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    appointmentSubTab === "upcoming"
                      ? "bg-[#00A3B8] text-white shadow-xs"
                      : "text-[#475B6B] hover:bg-[#E4EBF0]"
                  }`}
                >
                  Upcoming ({upcomingAppointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentSubTab("past")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    appointmentSubTab === "past"
                      ? "bg-[#00A3B8] text-white shadow-xs"
                      : "text-[#475B6B] hover:bg-[#E4EBF0]"
                  }`}
                >
                  Past visits ({pastAppointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentSubTab("find")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    appointmentSubTab === "find"
                      ? "bg-[#00A3B8] text-white shadow-xs"
                      : "text-[#475B6B] hover:bg-[#E4EBF0]"
                  }`}
                >
                  Find a clinic ({clinics.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowBookingModal(true);
                  if (clinics.length > 0 && !bookingFacilityId) {
                    setBookingFacilityId(clinics[0].id);
                  }
                }}
                className="h-8 px-3 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Book appointment</span>
              </button>
            </div>

            {/* Subtab: Upcoming */}
            {appointmentSubTab === "upcoming" && (
              <div className="space-y-3">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-white rounded-xl p-4 border border-[#E4EBF0] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-[#0F2942]">{appt.facility.name}</h4>
                          <span
                            className={`h-[22px] px-2.5 rounded-full text-xs font-medium flex items-center ${
                              appt.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-amber-50 text-amber-800 border border-amber-200/60"
                            }`}
                          >
                            {appt.status === "CONFIRMED" ? "Confirmed" : "Pending confirmation"}
                          </span>
                        </div>
                        <p className="text-xs text-[#475B6B] flex items-center gap-1.5">
                          <Clock size={13} className="text-[#00A3B8]" />
                          <span>{formatDateTime(appt.scheduledAt)}</span>
                          <span className="text-[#7A8D9B]">· {appt.appointmentType}</span>
                        </p>
                        {appt.reason && <p className="text-xs text-[#7A8D9B]">Reason: {appt.reason}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(appt.id)}
                          disabled={cancellingAppointmentId === appt.id}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {cancellingAppointmentId === appt.id ? "Cancelling..." : "Cancel booking"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl p-8 border border-[#E4EBF0] text-center">
                    <Calendar size={32} className="mx-auto text-[#7A8D9B]/50 mb-2" />
                    <p className="text-sm font-medium text-[#0F2942]">No upcoming appointments</p>
                    <p className="text-xs text-[#7A8D9B] mt-1">Browse participating clinics to schedule a visit.</p>
                    <button
                      type="button"
                      onClick={() => setAppointmentSubTab("find")}
                      className="mt-3 text-xs font-semibold text-[#00A3B8] hover:underline"
                    >
                      Browse clinic directory
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subtab: Past */}
            {appointmentSubTab === "past" && (
              <div className="space-y-3">
                {pastAppointments.length > 0 ? (
                  pastAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-white rounded-xl p-4 border border-[#E4EBF0] flex flex-col md:flex-row md:items-center justify-between gap-3 opacity-90"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-[#0F2942]">{appt.facility.name}</h4>
                          <span className="h-[22px] px-2 rounded-full text-xs font-medium bg-[#F0F4F8] text-[#7A8D9B] flex items-center">
                            {appt.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#7A8D9B] mt-1">{formatDateTime(appt.scheduledAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl p-8 border border-[#E4EBF0] text-center text-xs text-[#7A8D9B]">
                    No past appointments recorded.
                  </div>
                )}
              </div>
            )}

            {/* Subtab: Find a Clinic */}
            {appointmentSubTab === "find" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-2.5 text-[#7A8D9B]" />
                  <input
                    type="text"
                    value={clinicSearch}
                    onChange={(e) => setClinicSearch(e.target.value)}
                    placeholder="Search clinics by name, district, or service..."
                    className="w-full text-xs bg-white rounded-xl border border-[#E4EBF0] pl-9 pr-3 py-2 text-[#0F2942] placeholder-[#7A8D9B] focus:outline-none focus:ring-1 focus:ring-[#00A3B8]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="bg-white rounded-xl p-4 border border-[#E4EBF0] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-[#0F2942]">{clinic.name}</h4>
                          <span className="h-[22px] px-2 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center">
                            Active clinic
                          </span>
                        </div>
                        <p className="text-xs text-[#7A8D9B] flex items-center gap-1 mt-1">
                          <MapPin size={13} className="shrink-0 text-[#00A3B8]" />
                          <span>{clinic.address || "Kigali, Rwanda"}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {clinic.services.map((svc) => (
                            <span
                              key={svc}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-[#F6F8FA] text-[#475B6B] border border-[#E4EBF0]"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#E4EBF0] flex items-center justify-between">
                        <span className="text-[11px] text-[#7A8D9B]">{clinic.operatingHours}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingFacilityId(clinic.id);
                            setShowBookingModal(true);
                          }}
                          className="h-7 px-3 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold transition-colors"
                        >
                          Book appointment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: MEDICAL HISTORY                                       */}
        {/* ========================================================== */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Allergies Card */}
            <div className="bg-white rounded-xl p-5 border border-[#E4EBF0]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F2942]">Allergies and adverse reactions</h3>
                  <p className="text-xs text-[#7A8D9B] mt-0.5">Recorded patient allergies transmitted on NFC scan.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllergyModal(true)}
                  className="h-8 px-3 rounded-lg bg-[#F6F8FA] hover:bg-[#E4EBF0] border border-[#E4EBF0] text-xs font-medium text-[#0F2942] flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} />
                  <span>Add allergy</span>
                </button>
              </div>

              {selectedProfile.allergies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedProfile.allergies.map((allergy) => (
                    <div
                      key={allergy.id}
                      className="p-3 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-xs text-[#0F2942] block">{allergy.allergen}</span>
                        <span className="text-[11px] text-[#7A8D9B]">
                          Severity: {allergy.severity || "Not stated"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteAllergy(allergy.id)}
                        className="text-[#7A8D9B] hover:text-red-600 p-1 rounded transition-colors"
                        aria-label="Delete allergy"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7A8D9B]">No allergies currently recorded.</p>
              )}
            </div>

            {/* Chronic Conditions Card */}
            <div className="bg-white rounded-xl p-5 border border-[#E4EBF0]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F2942]">Medical conditions</h3>
                  <p className="text-xs text-[#7A8D9B] mt-0.5">Active or previous diagnosed medical conditions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConditionModal(true)}
                  className="h-8 px-3 rounded-lg bg-[#F6F8FA] hover:bg-[#E4EBF0] border border-[#E4EBF0] text-xs font-medium text-[#0F2942] flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} />
                  <span>Add condition</span>
                </button>
              </div>

              {selectedProfile.medicalConditions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedProfile.medicalConditions.map((cond) => (
                    <div
                      key={cond.id}
                      className="p-3 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-xs text-[#0F2942] block">{cond.name}</span>
                        {cond.description && <span className="text-[11px] text-[#7A8D9B]">{cond.description}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCondition(cond.id)}
                        className="text-[#7A8D9B] hover:text-red-600 p-1 rounded transition-colors"
                        aria-label="Delete condition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7A8D9B]">No medical conditions recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: CONSULTATIONS                                         */}
        {/* ========================================================== */}
        {activeTab === "consultations" && (
          <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0F2942]">Consultation history</h3>
              <p className="text-xs text-[#7A8D9B] mt-0.5">
                Past clinical consultations released by participating MedCard healthcare providers.
              </p>
            </div>

            {consultations.length > 0 ? (
              <div className="space-y-3">
                {consultations.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-[#F6F8FA] border border-[#E4EBF0] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-semibold text-sm text-[#0F2942]">{c.facility.name}</span>
                      <span className="text-[#7A8D9B]">{formatDate(c.startedAt)}</span>
                    </div>
                    <p className="text-xs text-[#475B6B]">
                      Clinician: Dr. {c.provider.firstName} {c.provider.lastName} · {c.type}
                    </p>
                    {c.diagnoses.length > 0 && (
                      <div className="text-xs text-[#0F2942] bg-white px-2.5 py-1 rounded-md border border-[#E4EBF0] inline-block font-medium">
                        Diagnosis: {c.diagnoses.map((d) => d.description).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#7A8D9B]">
                No consultation records found for this profile.
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: PRESCRIPTIONS & RESULTS                               */}
        {/* ========================================================== */}
        {activeTab === "prescriptions" && (
          <div className="space-y-6">
            {/* Prescriptions */}
            <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0F2942]">Active and previous prescriptions</h3>
                <p className="text-xs text-[#7A8D9B] mt-0.5">Dispensed or authorized medication courses.</p>
              </div>

              {prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-[#F6F8FA] border border-[#E4EBF0] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-xs text-[#0F2942]">
                          Prescribed by Dr. {p.prescribedBy.firstName} {p.prescribedBy.lastName}
                        </span>
                        <span className="h-[22px] px-2 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center">
                          {p.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {p.items.map((item) => (
                          <div key={item.id} className="text-xs text-[#475B6B] bg-white p-2 rounded-md border border-[#E4EBF0]">
                            <strong className="text-[#0F2942]">{item.medicationName}</strong> — {item.dosage} · {item.frequency} · {item.instructions}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7A8D9B]">No prescriptions on file.</p>
              )}
            </div>

            {/* Laboratory reports */}
            <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0F2942]">Laboratory and diagnostic results</h3>
                <p className="text-xs text-[#7A8D9B] mt-0.5">Diagnostic test reports released by authorized labs.</p>
              </div>

              {labResults.length > 0 ? (
                <div className="space-y-3">
                  {labResults.map((lab) => (
                    <div key={lab.id} className="p-4 rounded-xl bg-[#F6F8FA] border border-[#E4EBF0] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-xs text-[#0F2942]">
                          Lab Order · {lab.encounter?.facility?.name || "Clinic Lab"}
                        </span>
                        <span className="text-[#7A8D9B]">{formatDate(lab.completedAt || lab.requestedAt)}</span>
                      </div>
                      <div className="space-y-1">
                        {lab.results.map((r) => (
                          <div key={r.id} className="text-xs text-[#475B6B] bg-white p-2 rounded-md border border-[#E4EBF0] flex justify-between">
                            <span>{r.testName}</span>
                            <span className="font-semibold text-[#0F2942]">{r.resultValue} {r.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7A8D9B]">No laboratory test results recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: DOCUMENTS AND INSURANCE                               */}
        {/* ========================================================== */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            {/* Section 1: Documents */}
            <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F2942]">Medical documents</h3>
                  <p className="text-xs text-[#7A8D9B] mt-0.5">Medical reports, referral letters, and scan files.</p>
                </div>
              </div>

              {selectedProfile.medicalDocuments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProfile.medicalDocuments.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#00A3B8]" />
                        <span className="text-xs font-semibold text-[#0F2942]">{doc.title}</span>
                      </div>
                      <span className="text-[11px] text-[#7A8D9B]">{doc.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7A8D9B]">No uploaded medical documents.</p>
              )}
            </div>

            {/* Section 2: Insurance */}
            <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0F2942]">Insurance policies</h3>
                <p className="text-xs text-[#7A8D9B] mt-0.5">Linked health insurance policies and membership numbers.</p>
              </div>

              {selectedProfile.patientInsurances.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProfile.patientInsurances.map((ins) => (
                    <div key={ins.id} className="p-3.5 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0F2942]">
                          {ins.plan.provider.name} — {ins.plan.name}
                        </span>
                        <span className="h-[22px] px-2 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center">
                          {ins.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A8D9B] font-mono">Member ID: {ins.membershipNumber}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7A8D9B]">
                  No insurance cards linked. Current provider: {selectedProfile.insuranceProvider || "Direct payer"}.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: NOTIFICATIONS                                         */}
        {/* ========================================================== */}
        {activeTab === "notifications" && (
          <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0F2942]">Notifications and reminders</h3>
              <p className="text-xs text-[#7A8D9B] mt-0.5">
                Appointment confirmations, cancellations, reminders, and updates when new clinical records become available.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] flex items-start gap-3">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                  <CheckCircle2 size={16} />
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-[#0F2942]">Account active</h4>
                  <p className="text-xs text-[#475B6B] mt-0.5">
                    Your MedCard Patient Vault account is configured and synchronized with your card.
                  </p>
                  <span className="text-[11px] text-[#7A8D9B] block mt-1">Live status</span>
                </div>
              </div>

              {upcomingAppointments.length > 0 && (
                <div className="p-3.5 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] flex items-start gap-3">
                  <span className="p-1.5 rounded-lg bg-[#EAF3F8] text-[#00A3B8] shrink-0">
                    <Calendar size={16} />
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-[#0F2942]">Appointment reminder</h4>
                    <p className="text-xs text-[#475B6B] mt-0.5">
                      You have an appointment scheduled at {upcomingAppointments[0].facility.name} on{" "}
                      {formatDateTime(upcomingAppointments[0].scheduledAt)}.
                    </p>
                    <span className="text-[11px] text-[#7A8D9B] block mt-1">Upcoming</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: FAMILY PROFILES                                       */}
        {/* ========================================================== */}
        {activeTab === "family" && (
          <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0F2942]">Family profiles</h3>
                <p className="text-xs text-[#7A8D9B] mt-0.5">Manage health records for your children and dependents.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDependentModal(true)}
                className="h-8 px-3 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} />
                <span>Add dependent</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Primary Owner */}
              <div
                onClick={() => setSelectedProfileId(dashboard.patient.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedProfileId === dashboard.patient.id
                    ? "bg-[#F0F4F8] border-[#00A3B8]"
                    : "bg-white border-[#E4EBF0] hover:bg-[#F6F8FA]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#0F2942]">
                    {dashboard.patient.firstName} {dashboard.patient.lastName}
                  </span>
                  <span className="h-[20px] px-2 rounded-full text-[10px] font-medium bg-[#EAF3F8] text-[#00A3B8] flex items-center">
                    Primary
                  </span>
                </div>
                <p className="text-xs text-[#7A8D9B] font-mono mt-1">{dashboard.patient.patientNumber}</p>
              </div>

              {/* Dependents */}
              {dashboard.patient.dependents?.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedProfileId(d.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedProfileId === d.id
                      ? "bg-[#F0F4F8] border-[#00A3B8]"
                      : "bg-white border-[#E4EBF0] hover:bg-[#F6F8FA]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#0F2942]">
                      {d.firstName} {d.lastName}
                    </span>
                    <span className="h-[20px] px-2 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/50 flex items-center">
                      Dependent
                    </span>
                  </div>
                  <p className="text-xs text-[#7A8D9B] font-mono mt-1">{d.patientNumber}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: PROFILE                                               */}
        {/* ========================================================== */}
        {activeTab === "profile" && (
          <form onSubmit={saveProfile} className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-4 max-w-2xl">
            <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#0F2942]">Personal profile details</h3>
                <p className="text-xs text-[#7A8D9B] mt-0.5">Update your permitted personal and emergency information.</p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="h-8 px-3.5 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSaving && <LoaderCircle size={14} className="animate-spin text-white" />}
                <span className="text-white font-semibold">Save changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">First name</label>
                <input
                  required
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full text-xs bg-white rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Last name</label>
                <input
                  required
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full text-xs bg-white rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Phone number</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full text-xs bg-white rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">National ID / Passport</label>
                <input
                  value={profileForm.nationalId}
                  onChange={(e) => setProfileForm({ ...profileForm, nationalId: e.target.value })}
                  className="w-full text-xs bg-white rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Emergency contact name</label>
                <input
                  value={profileForm.emergencyContactName}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                  className="w-full text-xs bg-white rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Emergency contact phone</label>
                <input
                  value={profileForm.emergencyContactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                  className="w-full text-xs bg-white rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
            </div>
          </form>
        )}

        {/* ========================================================== */}
        {/* TAB: PLAN AND BILLING                                      */}
        {/* ========================================================== */}
        {activeTab === "billing" && (
          <div className="bg-white rounded-xl p-5 border border-[#E4EBF0] space-y-5 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-[#0F2942]">Plan and billing</h3>
              <p className="text-xs text-[#7A8D9B] mt-0.5">Manage your MedCard Patient Vault subscription tier.</p>
            </div>

            {/* Active Tier Card */}
            <div className="p-4 rounded-xl bg-[#F6F8FA] border border-[#E4EBF0] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#7A8D9B]">Current tier</span>
                <h4 className="text-lg font-semibold text-[#0F2942] mt-0.5">
                  {isPremium ? VAULT_PLANS.PREMIUM.displayName : VAULT_PLANS.BASIC.displayName}
                </h4>
                <p className="text-xs text-[#475B6B] mt-0.5">
                  {isPremium ? VAULT_PLANS.PREMIUM.price : VAULT_PLANS.BASIC.price} {VAULT_PLANS.BASIC.period}
                </p>
              </div>
              <span className="h-[22px] px-2.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center">
                Active
              </span>
            </div>

            {/* Upgrade Card if Basic */}
            {!isPremium ? (
              <div className="p-4 rounded-xl border border-[#00A3B8]/30 bg-[#EAF3F8]/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#0F2942]">
                      Upgrade to {VAULT_PLANS.PREMIUM.displayName}
                    </h4>
                    <p className="text-xs text-[#475B6B] mt-0.5">
                      {VAULT_PLANS.PREMIUM.subtitle}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#00A3B8]">
                    {VAULT_PLANS.PREMIUM.price}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-medium text-[#475B6B] block">
                    Mobile Money number (MTN / Airtel)
                    <input
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="2507XXXXXXXX"
                      className="w-full text-xs rounded-lg border border-[#E4EBF0] px-3 py-2 bg-white mt-1"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={upgradePlan}
                    disabled={isPaying || !paymentPhone.trim()}
                    className="w-full h-9 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isPaying ? <LoaderCircle size={15} className="animate-spin text-white" /> : <CreditCard size={15} className="text-white" />}
                    <span className="text-white font-semibold">{isPaying ? "Awaiting prompt approval..." : `Pay with Mobile Money (${VAULT_PLANS.PREMIUM.price})`}</span>
                  </button>
                  <p className="text-[11px] text-[#7A8D9B] text-center">
                    Securely processed via XentriPay Rwanda. You will receive a push prompt on your mobile phone.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>You are on the Premium plan with all health record features enabled.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: BOOK APPOINTMENT                                        */}
      {/* ============================================================== */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E4EBF0] max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-3">
              <h3 className="text-sm font-semibold text-[#0F2942]">Book clinic appointment</h3>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="text-[#7A8D9B] hover:text-[#0F2942] p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Participating clinic</label>
                <select
                  required
                  value={bookingFacilityId}
                  onChange={(e) => setBookingFacilityId(e.target.value)}
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                >
                  <option value="">Select clinic</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.address || "Kigali"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Service requested</label>
                <input
                  required
                  value={bookingService}
                  onChange={(e) => setBookingService(e.target.value)}
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#475B6B] block">Date</label>
                  <input
                    required
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475B6B] block">Time</label>
                  <input
                    required
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Reason for visit</label>
                <input
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  placeholder="e.g. Follow-up consultation or annual checkup"
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E4EBF0]">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="h-8 px-3 rounded-lg border border-[#E4EBF0] text-xs font-medium text-[#475B6B] hover:bg-[#F6F8FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="h-8 px-3.5 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmittingBooking && <LoaderCircle size={14} className="animate-spin text-white" />}
                  <span className="text-white font-semibold">Submit request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD ALLERGY                                             */}
      {/* ============================================================== */}
      {showAllergyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E4EBF0] max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-2">
              <h3 className="text-sm font-semibold text-[#0F2942]">Add allergy record</h3>
              <button
                type="button"
                onClick={() => setShowAllergyModal(false)}
                className="text-[#7A8D9B] hover:text-[#0F2942] p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={addAllergy} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Allergen</label>
                <input
                  required
                  value={allergyName}
                  onChange={(e) => setAllergyName(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts"
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Reaction (optional)</label>
                <input
                  value={allergyReaction}
                  onChange={(e) => setAllergyReaction(e.target.value)}
                  placeholder="e.g. Skin rash, swelling"
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-[#E4EBF0]">
                <button
                  type="button"
                  onClick={() => setShowAllergyModal(false)}
                  className="h-8 px-3 rounded-lg border border-[#E4EBF0] text-xs font-medium text-[#475B6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-8 px-3.5 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <span className="text-white font-semibold">Save allergy</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD CONDITION                                           */}
      {/* ============================================================== */}
      {showConditionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E4EBF0] max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-2">
              <h3 className="text-sm font-semibold text-[#0F2942]">Add medical condition</h3>
              <button
                type="button"
                onClick={() => setShowConditionModal(false)}
                className="text-[#7A8D9B] hover:text-[#0F2942] p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={addCondition} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Condition name</label>
                <input
                  required
                  value={conditionName}
                  onChange={(e) => setConditionName(e.target.value)}
                  placeholder="e.g. Asthma, Hypertension"
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Notes (optional)</label>
                <input
                  value={conditionDescription}
                  onChange={(e) => setConditionDescription(e.target.value)}
                  placeholder="e.g. Diagnosed in 2021"
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-[#E4EBF0]">
                <button
                  type="button"
                  onClick={() => setShowConditionModal(false)}
                  className="h-8 px-3 rounded-lg border border-[#E4EBF0] text-xs font-medium text-[#475B6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-8 px-3.5 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <span className="text-white font-semibold">Save condition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD DEPENDENT                                           */}
      {/* ============================================================== */}
      {showDependentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E4EBF0] max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-2">
              <h3 className="text-sm font-semibold text-[#0F2942]">Add family profile</h3>
              <button
                type="button"
                onClick={() => setShowDependentModal(false)}
                className="text-[#7A8D9B] hover:text-[#0F2942] p-1"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={addDependent} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">First name</label>
                <input
                  required
                  value={dependentForm.firstName}
                  onChange={(e) => setDependentForm({ ...dependentForm, firstName: e.target.value })}
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475B6B] block">Last name</label>
                <input
                  required
                  value={dependentForm.lastName}
                  onChange={(e) => setDependentForm({ ...dependentForm, lastName: e.target.value })}
                  className="w-full text-xs bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] px-3 py-2 text-[#0F2942] mt-1"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-[#E4EBF0]">
                <button
                  type="button"
                  onClick={() => setShowDependentModal(false)}
                  className="h-8 px-3 rounded-lg border border-[#E4EBF0] text-xs font-medium text-[#475B6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-8 px-3.5 rounded-lg bg-[#00A3B8] hover:bg-[#008f9e] text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <span className="text-white font-semibold">Create profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
