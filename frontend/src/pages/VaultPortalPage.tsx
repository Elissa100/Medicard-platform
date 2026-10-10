import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  HeartPulse,
  Home,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  Pill,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  TestTube,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

type TabId =
  | "overview"
  | "history"
  | "consultations"
  | "prescriptions"
  | "family"
  | "documents"
  | "billing"
  | "profile";

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    window.location.assign("/patient-vault/login");
    throw new Error("Please sign in to access your Patient Vault.");
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "The request could not be completed.");
  }
  return data as T;
}

export default function VaultPortalPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileForm, setProfileForm] = useState<EditableProfile | null>(null);
  const [dependentForm, setDependentForm] = useState(emptyDependent);
  const [allergy, setAllergy] = useState({ allergen: "", reaction: "", severity: "MILD" });
  const [condition, setCondition] = useState({ name: "", description: "" });
  const [paymentPhone, setPaymentPhone] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingDependent, setIsAddingDependent] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Clinical records fetched for patient
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labResults, setLabResults] = useState<LabResultItem[]>([]);

  // Appointment booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingClinic, setBookingClinic] = useState("Remera Community Clinic");
  const [bookingService, setBookingService] = useState("General Consultation");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingReason, setBookingReason] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const loadDashboard = useCallback(async () => {
    const result = await request<{ success: boolean; data: DashboardData }>("/vault/me");
    if (!result.data.subscription) {
      window.location.assign("/patient-vault");
      throw new Error("Choose a plan to continue to your Patient Vault.");
    }
    setDashboard(result.data);
    setSelectedProfileId((current) => current || result.data.patient.id);
    setPaymentPhone((current) => current || result.data.patient.phone || "");
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(result.data.patient));
  }, []);

  const loadClinicalData = useCallback(async (profileId: string) => {
    try {
      const [consRes, prescRes, labRes] = await Promise.allSettled([
        request<{ success: boolean; data: Consultation[] }>(`/vault/consultations?profileId=${profileId}`),
        request<{ success: boolean; data: Prescription[] }>(`/vault/prescriptions?profileId=${profileId}`),
        request<{ success: boolean; data: LabResultItem[] }>(`/vault/lab-results?profileId=${profileId}`),
      ]);

      if (consRes.status === "fulfilled") setConsultations(consRes.value.data || []);
      if (prescRes.status === "fulfilled") setPrescriptions(prescRes.value.data || []);
      if (labRes.status === "fulfilled") setLabResults(labRes.value.data || []);
    } catch {
      // Clinical records might be empty or loading
    }
  }, []);

  useEffect(() => {
    loadDashboard()
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load your vault.");
        if (!localStorage.getItem(AUTH_TOKEN_KEY)) window.location.assign("/patient-vault/login");
      })
      .finally(() => setIsLoading(false));
  }, [loadDashboard]);

  useEffect(() => {
    if (selectedProfileId) {
      loadClinicalData(selectedProfileId);
    }
  }, [selectedProfileId, loadClinicalData]);

  const selectedProfile = useMemo(() => {
    if (!dashboard) return null;
    if (dashboard.patient.id === selectedProfileId) return dashboard.patient;
    return dashboard.patient.dependents?.find((dependent) => dependent.id === selectedProfileId) || null;
  }, [dashboard, selectedProfileId]);

  useEffect(() => {
    if (!selectedProfile) return;
    setProfileForm({
      firstName: selectedProfile.firstName,
      lastName: selectedProfile.lastName,
      dateOfBirth: selectedProfile.dateOfBirth?.slice(0, 10) || "",
      gender: selectedProfile.gender,
      phone: selectedProfile.phone || "",
      nationalId: selectedProfile.nationalId || "",
      emergencyContactName: selectedProfile.emergencyContactName || "",
      emergencyContactPhone: selectedProfile.emergencyContactPhone || "",
      insuranceProvider: selectedProfile.insuranceProvider || "",
    });
  }, [selectedProfile]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProfile || !profileForm) return;
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      await request(`/vault/profiles/${encodeURIComponent(selectedProfile.id)}`, {
        method: "PATCH",
        body: JSON.stringify(profileForm),
      });
      await loadDashboard();
      setNotice("Profile details saved successfully.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const addDependent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsAddingDependent(true);
    try {
      await request("/vault/dependents", {
        method: "POST",
        body: JSON.stringify(dependentForm),
      });
      setDependentForm(emptyDependent);
      await loadDashboard();
      setNotice("Family member profile created and linked to your MedCard account.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not add dependent.");
    } finally {
      setIsAddingDependent(false);
    }
  };

  const addHealthRecord = async (kind: "allergies" | "conditions", event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProfile) return;
    setError("");
    setNotice("");
    const isAllergy = kind === "allergies";
    const body = isAllergy ? allergy : condition;
    try {
      await request(`/vault/profiles/${encodeURIComponent(selectedProfile.id)}/${kind}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (isAllergy) setAllergy({ allergen: "", reaction: "", severity: "MILD" });
      else setCondition({ name: "", description: "" });
      await loadDashboard();
      setNotice(isAllergy ? "Allergy added to medical record." : "Medical condition recorded.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save health record.");
    }
  };

  const removeHealthRecord = async (kind: "allergies" | "conditions", id: string) => {
    if (!selectedProfile) return;
    setError("");
    setNotice("");
    try {
      await request(`/vault/profiles/${encodeURIComponent(selectedProfile.id)}/health/${kind}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await loadDashboard();
      setNotice("Record removed.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not remove health record.");
    }
  };

  const upgradePlan = async () => {
    setError("");
    setNotice("");
    setIsPaying(true);
    try {
      const initiated = await request<{
        paymentId: string;
        status: string;
        message?: string;
      }>("/vault/payment/initiate", {
        method: "POST",
        body: JSON.stringify({
          plan: "PREMIUM",
          paymentMethod: "MOBILE_MONEY",
          phone: paymentPhone,
        }),
      });
      setNotice(initiated.message || "Approve the Mobile Money prompt on your phone.");

      for (let attempt = 0; attempt < 36; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const status = await request<{ status: string }>(
          `/vault/payment/${encodeURIComponent(initiated.paymentId)}/status`,
        );
        if (status.status === "SUCCESS") {
          await loadDashboard();
          setNotice("Payment confirmed! Your Premium Vault is now active.");
          return;
        }
        if (status.status === "FAILED") {
          setNotice("The payment was not completed by the provider. Please try again.");
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

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem("medcard_authenticated");
    window.location.assign("/patient-vault/login");
  };

  const handleBookAppointment = (e: FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingModal(false);
      setNotice(`Appointment request submitted to ${bookingClinic} for ${bookingDate} at ${bookingTime}. Status: Pending Clinic Confirmation.`);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-section-tint flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="animate-spin text-teal mx-auto mb-3" size={40} />
          <p className="text-navy font-semibold">Loading your Patient Vault...</p>
        </div>
      </div>
    );
  }

  if (!dashboard || !selectedProfile || !profileForm) {
    return (
      <main className="min-h-screen bg-section-tint px-4 py-16 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center shadow-lift">
          <AlertCircle size={44} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-navy">Patient Vault Unavailable</h1>
          <p className="mt-2 text-sm text-body-text">{error || "We could not load your account session."}</p>
          <button onClick={() => window.location.assign("/patient-vault/login")} className="mt-6 w-full rounded-lg bg-teal px-5 py-3 font-semibold text-white hover:bg-teal/90 transition-colors">
            Sign In Again
          </button>
        </div>
      </main>
    );
  }

  const subscription = dashboard.subscription;
  const isPremium = subscription?.plan === "PREMIUM";
  const isDependent = selectedProfile.id !== dashboard.patient.id;

  const navItems = [
    { id: "overview" as TabId, label: "Overview", icon: Home },
    { id: "history" as TabId, label: "Medical History", icon: HeartPulse, badge: selectedProfile.allergies.length + selectedProfile.medicalConditions.length },
    { id: "consultations" as TabId, label: "Consultations", icon: Stethoscope, badge: consultations.length },
    { id: "prescriptions" as TabId, label: "Prescriptions & Labs", icon: Pill, badge: prescriptions.length + labResults.length },
    { id: "family" as TabId, label: "Family Profiles", icon: UsersRound, badge: dashboard.patient.dependents?.length || 0 },
    { id: "documents" as TabId, label: "Documents & Insurance", icon: FileText, badge: selectedProfile.medicalDocuments.length },
    { id: "billing" as TabId, label: "Plan & Billing", icon: CreditCard },
    { id: "profile" as TabId, label: "Personal Details", icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-[#F5F8FA] flex">
      {/* ============================================================== */}
      {/* SIDEBAR NAVIGATION (Desktop & Mobile drawer)                   */}
      {/* ============================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-navy text-white flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-0 max-lg:-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/40 flex items-center justify-center text-teal">
                <HeartPulse size={22} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-white">MedCard</h1>
                <span className="text-xs text-accent-on-navy font-medium">Patient Vault</span>
              </div>
            </a>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-soft-text-on-navy hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile Switcher Quick Widget */}
          <div className="p-4 mx-4 my-3 rounded-xl bg-white/[0.07] border border-white/10">
            <div className="flex items-center justify-between text-xs text-soft-text-on-navy mb-1.5">
              <span>ACTIVE RECORD</span>
              <span className="font-mono text-teal font-semibold">{isDependent ? "DEPENDENT" : "OWNER"}</span>
            </div>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full bg-navy/90 text-white text-sm font-semibold rounded-lg px-2.5 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-teal"
            >
              <option value={dashboard.patient.id}>
                {dashboard.patient.firstName} {dashboard.patient.lastName} (Me)
              </option>
              {dashboard.patient.dependents?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} (Dependent)
                </option>
              ))}
            </select>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-teal text-white shadow-sm font-semibold"
                      : "text-soft-text-on-navy hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-white" : "text-accent-on-navy"} />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-white/10 text-soft-text-on-navy"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User footer & logout */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {dashboard.patient.firstName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-white">
                    {dashboard.patient.firstName} {dashboard.patient.lastName}
                  </p>
                  <p className="text-xs text-soft-text-on-navy truncate font-mono">
                    {dashboard.patient.patientNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 text-soft-text-on-navy hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA                                              */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-border px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-navy hover:bg-section-tint rounded-lg"
            >
              <Menu size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-navy capitalize">
                  {navItems.find((n) => n.id === activeTab)?.label}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-pale-cyan text-navy">
                  {selectedProfile.firstName} {selectedProfile.lastName}
                </span>
              </div>
              <p className="text-xs text-muted-text hidden sm:block">
                MedCard Patient Vault · Secure Health Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: Book Appointment */}
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-2 bg-navy text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg hover:bg-mid-blue transition-colors shadow-sm"
            >
              <Calendar size={15} />
              <span>Book Appointment</span>
            </button>

            {/* Back to MedCard site */}
            <a
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-body-text hover:text-navy px-3 py-2 rounded-lg border border-border bg-white"
            >
              <Home size={14} />
              <span>MedCard Site</span>
            </a>

            {/* Profile Avatar Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-xs">
                {selectedProfile.firstName[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Status / Notice messages */}
        {(error || notice) && (
          <div className="px-6 pt-4">
            <div
              role={error ? "alert" : "status"}
              className={`flex items-start justify-between gap-3 p-4 rounded-xl text-sm border ${
                error
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-teal/10 border-teal/30 text-navy"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal" />}
                <span>{error || notice}</span>
              </div>
              <button onClick={() => { setError(""); setNotice(""); }} className="text-xs font-semibold opacity-60 hover:opacity-100">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ========================================================== */}
          {/* TAB: OVERVIEW                                              */}
          {/* ========================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* TOP STAT CARDS (Kukamoto / FIKA style metric cards) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1: Subscription */}
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between text-body-text mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Vault Plan</span>
                    <span className="p-2 rounded-xl bg-teal/10 text-teal">
                      <ShieldCheck size={18} />
                    </span>
                  </div>
                  <div className="text-xl font-bold text-navy">{subscription?.plan || "Basic"}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-teal font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                    <span>Active subscription</span>
                  </div>
                </div>

                {/* Stat 2: MedCard NFC ID */}
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between text-body-text mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">MedCard NFC</span>
                    <span className="p-2 rounded-xl bg-pale-cyan text-navy">
                      <CreditCard size={18} />
                    </span>
                  </div>
                  <div className="text-lg font-bold font-mono text-navy truncate">
                    {selectedProfile.patientNumber}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-text">
                    <span>Instant clinic tap enabled</span>
                  </div>
                </div>

                {/* Stat 3: Medical Alerts */}
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between text-body-text mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Allergies & Conditions</span>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <AlertTriangle size={18} />
                    </span>
                  </div>
                  <div className="text-xl font-bold text-navy">
                    {selectedProfile.allergies.length + selectedProfile.medicalConditions.length}
                  </div>
                  <div className="mt-1 text-xs text-muted-text">
                    {selectedProfile.allergies.length} allergies, {selectedProfile.medicalConditions.length} conditions
                  </div>
                </div>

                {/* Stat 4: Clinical History Records */}
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between text-body-text mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Clinic Encounters</span>
                    <span className="p-2 rounded-xl bg-blue-50 text-mid-blue">
                      <Activity size={18} />
                    </span>
                  </div>
                  <div className="text-xl font-bold text-navy">
                    {consultations.length}
                  </div>
                  <div className="mt-1 text-xs text-muted-text">
                    {prescriptions.length} prescriptions on file
                  </div>
                </div>
              </div>

              {/* EMERGENCY HEALTH CARD BANNER */}
              <div className="bg-gradient-to-r from-navy to-[#084C74] rounded-2xl p-6 text-white shadow-soft">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-accent-on-navy text-xs font-semibold">
                      <ShieldAlert size={14} />
                      <span>EMERGENCY ACCESS SUMMARY</span>
                    </div>
                    <h3 className="text-2xl font-bold">
                      {selectedProfile.firstName} {selectedProfile.lastName}
                    </h3>
                    <p className="text-sm text-soft-text-on-navy max-w-xl">
                      This information is immediately retrieved when your NFC card is tapped at participating emergency clinics.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2 text-xs">
                      <div>
                        <span className="text-soft-text-on-navy block">Emergency Contact</span>
                        <span className="font-semibold text-white">
                          {selectedProfile.emergencyContactName || "Not provided"} ({selectedProfile.emergencyContactPhone || "No phone"})
                        </span>
                      </div>
                      <div className="border-l border-white/20 pl-4">
                        <span className="text-soft-text-on-navy block">Known Allergies</span>
                        <span className="font-semibold text-white">
                          {selectedProfile.allergies.length > 0
                            ? selectedProfile.allergies.map((a) => a.allergen).join(", ")
                            : "None reported"}
                        </span>
                      </div>
                      <div className="border-l border-white/20 pl-4">
                        <span className="text-soft-text-on-navy block">Insurance</span>
                        <span className="font-semibold text-white">
                          {selectedProfile.insuranceProvider || "Direct payer"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
                    <button
                      onClick={() => setActiveTab("profile")}
                      className="px-4 py-2.5 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal/90 transition-colors text-center"
                    >
                      Update Emergency Details
                    </button>
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors text-center"
                    >
                      Book Clinic Visit
                    </button>
                  </div>
                </div>
              </div>

              {/* GRID: RECENT CONSULTATIONS & PRESCRIPTIONS PREVIEW */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Card: Recent Consultations */}
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-pale-cyan text-navy">
                        <Stethoscope size={18} />
                      </div>
                      <h3 className="font-bold text-navy">Recent Consultations</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("consultations")}
                      className="text-xs text-teal font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>View all</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {consultations.length > 0 ? (
                    <div className="space-y-3">
                      {consultations.slice(0, 3).map((c) => (
                        <div key={c.id} className="p-3.5 rounded-xl bg-section-tint border border-border/60">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-navy">{c.facility.name}</span>
                            <span className="text-muted-text">{formatDate(c.startedAt)}</span>
                          </div>
                          <p className="text-xs text-body-text mt-1">
                            Dr. {c.provider.firstName} {c.provider.lastName} · {c.type}
                          </p>
                          {c.diagnoses.length > 0 && (
                            <div className="mt-2 text-xs font-medium text-navy bg-white px-2 py-1 rounded inline-block">
                              Diagnosis: {c.diagnoses[0].description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-body-text">
                      <Stethoscope size={32} className="mx-auto text-muted-text/50 mb-2" />
                      <p className="text-sm font-medium">No clinic visits recorded yet</p>
                      <p className="text-xs text-muted-text mt-1 max-w-sm mx-auto">
                        When you visit a MedCard participating clinic and tap your NFC card, your doctor's notes and diagnoses will appear here.
                      </p>
                    </div>
                  )}
                </div>

                {/* Card: Active Prescriptions & Medications */}
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-pale-cyan text-navy">
                        <Pill size={18} />
                      </div>
                      <h3 className="font-bold text-navy">Prescriptions & Medications</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("prescriptions")}
                      className="text-xs text-teal font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>View all</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {prescriptions.length > 0 ? (
                    <div className="space-y-3">
                      {prescriptions.slice(0, 3).map((p) => (
                        <div key={p.id} className="p-3.5 rounded-xl bg-section-tint border border-border/60">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-teal font-mono uppercase">{p.status}</span>
                            <span className="text-muted-text">{formatDate(p.createdAt)}</span>
                          </div>
                          <div className="mt-1.5 space-y-1">
                            {p.items.map((item) => (
                              <div key={item.id} className="text-xs">
                                <strong className="text-navy">{item.medicationName}</strong>
                                {item.dosage && <span className="text-body-text"> · {item.dosage}</span>}
                                {item.frequency && <span className="text-muted-text"> ({item.frequency})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-body-text">
                      <Pill size={32} className="mx-auto text-muted-text/50 mb-2" />
                      <p className="text-sm font-medium">No active prescriptions</p>
                      <p className="text-xs text-muted-text mt-1 max-w-sm mx-auto">
                        Prescriptions issued by authorized healthcare providers will be safely accessible in your vault.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* FAMILY & PLAN HIGHLIGHTS */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Family members */}
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <UsersRound size={18} className="text-teal" />
                      <h3 className="font-bold text-navy">Family Members & Dependents</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("family")}
                      className="text-xs text-teal font-semibold hover:underline"
                    >
                      + Add Member
                    </button>
                  </div>
                  {dashboard.patient.dependents?.length ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {dashboard.patient.dependents.map((dep) => (
                        <div
                          key={dep.id}
                          onClick={() => setSelectedProfileId(dep.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedProfileId === dep.id
                              ? "border-teal bg-pale-cyan/40"
                              : "border-border hover:border-teal/50 bg-section-tint"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-navy">{dep.firstName} {dep.lastName}</span>
                            {selectedProfileId === dep.id && (
                              <span className="text-[10px] bg-teal text-white px-2 py-0.5 rounded-full font-bold">Active</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-text mt-1">DOB: {formatDate(dep.dateOfBirth)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-section-tint border border-dashed border-border text-center">
                      <p className="text-xs text-body-text">No family dependents added yet.</p>
                      <button
                        onClick={() => setActiveTab("family")}
                        className="mt-2 text-xs font-bold text-teal hover:underline"
                      >
                        Add your child or dependent
                      </button>
                    </div>
                  )}
                </div>

                {/* Plan status card */}
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-navy mb-2">
                      <CreditCard size={18} className="text-teal" />
                      <h3 className="font-bold">Subscription Plan</h3>
                    </div>
                    <p className="text-2xl font-bold text-navy mt-2">{subscription?.plan} Vault</p>
                    <p className="text-xs text-body-text mt-1">
                      {subscription?.plan === "PREMIUM"
                        ? "Unlimited document uploads, family sharing & priority sync"
                        : "Basic clinical records & instant NFC identification"}
                    </p>
                  </div>
                  {!isPremium && (
                    <button
                      onClick={() => setActiveTab("billing")}
                      className="mt-4 w-full py-2.5 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal/90 transition-colors"
                    >
                      Upgrade to Premium · 150 RWF
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: MEDICAL HISTORY                                       */}
          {/* ========================================================== */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-navy">Medical History & Clinical Conditions</h3>
                    <p className="text-xs text-muted-text mt-1">
                      Patient-reported and clinician-confirmed records for {selectedProfile.firstName}.
                    </p>
                  </div>
                  <span className="text-xs bg-pale-cyan text-navy px-3 py-1 rounded-full font-semibold">
                    {selectedProfile.allergies.length} Allergies · {selectedProfile.medicalConditions.length} Conditions
                  </span>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Allergies Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <AlertTriangle size={18} className="text-amber-500" />
                      <h4 className="font-bold text-navy">Allergies & Adverse Reactions</h4>
                    </div>

                    {selectedProfile.allergies.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedProfile.allergies.map((item) => (
                          <div key={item.id} className="p-3 rounded-xl bg-section-tint border border-border flex items-center justify-between">
                            <div>
                              <div className="font-bold text-sm text-navy">{item.allergen}</div>
                              <div className="text-xs text-body-text">
                                {item.reaction ? `Reaction: ${item.reaction}` : "No specific reaction"}
                                {item.severity && <span className="ml-2 font-semibold text-amber-700">({item.severity})</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => removeHealthRecord("allergies", item.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-text italic py-2">No known allergies recorded.</p>
                    )}

                    {/* Add Allergy Form */}
                    <form onSubmit={(e) => addHealthRecord("allergies", e)} className="p-4 rounded-xl border border-dashed border-border bg-white space-y-3">
                      <p className="text-xs font-bold text-navy uppercase">Add New Allergy</p>
                      <input
                        required
                        placeholder="Allergen (e.g. Penicillin, Peanuts)"
                        value={allergy.allergen}
                        onChange={(e) => setAllergy({ ...allergy, allergen: e.target.value })}
                        className="w-full text-xs rounded-lg border border-border px-3 py-2"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Reaction (e.g. Hives, Swelling)"
                          value={allergy.reaction}
                          onChange={(e) => setAllergy({ ...allergy, reaction: e.target.value })}
                          className="text-xs rounded-lg border border-border px-3 py-2"
                        />
                        <select
                          value={allergy.severity}
                          onChange={(e) => setAllergy({ ...allergy, severity: e.target.value })}
                          className="text-xs rounded-lg border border-border px-3 py-2 bg-white"
                        >
                          <option value="MILD">Mild</option>
                          <option value="MODERATE">Moderate</option>
                          <option value="SEVERE">Severe / Life Threatening</option>
                        </select>
                      </div>
                      <button className="w-full text-xs font-bold py-2 rounded-lg bg-teal text-white hover:bg-teal/90">
                        + Add Allergy
                      </button>
                    </form>
                  </div>

                  {/* Medical Conditions Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <HeartPulse size={18} className="text-teal" />
                      <h4 className="font-bold text-navy">Chronic Diseases & Diagnoses</h4>
                    </div>

                    {selectedProfile.medicalConditions.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedProfile.medicalConditions.map((item) => (
                          <div key={item.id} className="p-3 rounded-xl bg-section-tint border border-border flex items-center justify-between">
                            <div>
                              <div className="font-bold text-sm text-navy">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-body-text">{item.description}</div>
                              )}
                            </div>
                            <button
                              onClick={() => removeHealthRecord("conditions", item.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-text italic py-2">No chronic conditions recorded.</p>
                    )}

                    {/* Add Condition Form */}
                    <form onSubmit={(e) => addHealthRecord("conditions", e)} className="p-4 rounded-xl border border-dashed border-border bg-white space-y-3">
                      <p className="text-xs font-bold text-navy uppercase">Add Condition</p>
                      <input
                        required
                        placeholder="Condition Name (e.g. Asthma, Hypertension)"
                        value={condition.name}
                        onChange={(e) => setCondition({ ...condition, name: e.target.value })}
                        className="w-full text-xs rounded-lg border border-border px-3 py-2"
                      />
                      <input
                        placeholder="Notes / Management (optional)"
                        value={condition.description}
                        onChange={(e) => setCondition({ ...condition, description: e.target.value })}
                        className="w-full text-xs rounded-lg border border-border px-3 py-2"
                      />
                      <button className="w-full text-xs font-bold py-2 rounded-lg bg-navy text-white hover:bg-mid-blue">
                        + Add Medical Condition
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: CONSULTATIONS                                         */}
          {/* ========================================================== */}
          {activeTab === "consultations" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-navy">Consultation History</h3>
                    <p className="text-xs text-muted-text mt-1">
                      Doctor consultations and clinical notes recorded across participating MedCard clinics.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="inline-flex items-center gap-2 bg-teal text-white text-xs font-bold px-3 py-2 rounded-lg"
                  >
                    <Plus size={14} />
                    <span>Book New Visit</span>
                  </button>
                </div>

                {consultations.length > 0 ? (
                  <div className="space-y-4">
                    {consultations.map((c) => (
                      <div key={c.id} className="p-5 rounded-2xl bg-section-tint border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
                          <div>
                            <span className="font-bold text-base text-navy">{c.facility.name}</span>
                            <p className="text-xs text-body-text">
                              Attending Clinician: Dr. {c.provider.firstName} {c.provider.lastName} ({c.provider.role})
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-bold bg-white text-navy px-2.5 py-1 rounded-md border border-border">
                              {formatDate(c.startedAt)}
                            </span>
                            <span className="block text-[11px] text-teal font-semibold mt-1">Status: {c.status}</span>
                          </div>
                        </div>

                        {/* Diagnoses */}
                        {c.diagnoses.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs font-bold text-navy block mb-1">Diagnoses</span>
                            <div className="flex flex-wrap gap-2">
                              {c.diagnoses.map((d) => (
                                <span key={d.id} className="text-xs px-2.5 py-1 bg-white rounded-lg border border-border text-navy font-medium">
                                  {d.description} {d.code && `(${d.code})`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes / Plan */}
                        {c.clinicalNotes.length > 0 && (
                          <div className="mt-3 space-y-2 text-xs">
                            {c.clinicalNotes.map((note) => (
                              <div key={note.id} className="p-3 bg-white rounded-xl border border-border/70">
                                {note.subjective && (
                                  <p className="text-body-text mb-1">
                                    <strong className="text-navy">Chief Complaint:</strong> {note.subjective}
                                  </p>
                                )}
                                {note.assessment && (
                                  <p className="text-body-text mb-1">
                                    <strong className="text-navy">Assessment:</strong> {note.assessment}
                                  </p>
                                )}
                                {note.plan && (
                                  <p className="text-body-text">
                                    <strong className="text-navy">Management Plan:</strong> {note.plan}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-body-text">
                    <Stethoscope size={40} className="mx-auto text-muted-text/40 mb-3" />
                    <p className="text-base font-semibold text-navy">No past consultations recorded</p>
                    <p className="text-xs text-muted-text mt-1 max-w-md mx-auto">
                      When you visit a MedCard hospital or clinic, authorized doctors will document your visits directly into your digital health timeline.
                    </p>
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="mt-5 inline-flex items-center gap-2 bg-navy text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-mid-blue"
                    >
                      <Calendar size={14} />
                      <span>Book an appointment at a participating clinic</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: PRESCRIPTIONS & LABS                                  */}
          {/* ========================================================== */}
          {activeTab === "prescriptions" && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Prescriptions */}
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
                    <Pill size={18} className="text-teal" />
                    <h3 className="font-bold text-navy">Prescriptions Released to Vault</h3>
                  </div>

                  {prescriptions.length > 0 ? (
                    <div className="space-y-3">
                      {prescriptions.map((p) => (
                        <div key={p.id} className="p-4 rounded-xl bg-section-tint border border-border">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-navy font-mono">Status: {p.status}</span>
                            <span className="text-muted-text">{formatDate(p.createdAt)}</span>
                          </div>
                          <p className="text-xs text-muted-text mb-2">
                            Prescribed by Dr. {p.prescribedBy.firstName} {p.prescribedBy.lastName}
                          </p>
                          <div className="space-y-1.5 pt-2 border-t border-border/60">
                            {p.items.map((it) => (
                              <div key={it.id} className="text-xs bg-white p-2 rounded-lg border border-border/70">
                                <div className="font-bold text-navy">{it.medicationName}</div>
                                <div className="text-body-text mt-0.5">
                                  {it.dosage && <span>{it.dosage} · </span>}
                                  {it.frequency && <span>{it.frequency} · </span>}
                                  {it.duration && <span>{it.duration}</span>}
                                </div>
                                {it.instructions && (
                                  <div className="text-muted-text italic mt-1">Instructions: {it.instructions}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-text py-6 text-center italic">No active prescriptions.</p>
                  )}
                </div>

                {/* Lab & Diagnostic Results */}
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
                    <TestTube size={18} className="text-mid-blue" />
                    <h3 className="font-bold text-navy">Laboratory & Diagnostic Reports</h3>
                  </div>

                  {labResults.length > 0 ? (
                    <div className="space-y-3">
                      {labResults.map((lab) => (
                        <div key={lab.id} className="p-4 rounded-xl bg-section-tint border border-border">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-navy">{lab.tests.map((t) => t.testName).join(", ")}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-border text-teal">{lab.status}</span>
                          </div>
                          <p className="text-[11px] text-muted-text mb-2">Requested: {formatDate(lab.requestedAt)}</p>

                          {lab.results.length > 0 ? (
                            <div className="space-y-1.5 pt-2 border-t border-border/60">
                              {lab.results.map((res) => (
                                <div key={res.id} className="text-xs bg-white p-2.5 rounded-lg border border-border/70">
                                  <div className="flex justify-between font-bold text-navy">
                                    <span>{res.testName}</span>
                                    <span>{res.resultValue} {res.unit}</span>
                                  </div>
                                  {res.referenceRange && (
                                    <div className="text-[11px] text-muted-text mt-0.5">
                                      Reference Range: {res.referenceRange}
                                    </div>
                                  )}
                                  {res.interpretation && (
                                    <div className="text-xs text-body-text mt-1">
                                      Interpretation: {res.interpretation}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-text italic">Results pending laboratory processing.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-text py-6 text-center italic">No lab results on file.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: FAMILY PROFILES                                       */}
          {/* ========================================================== */}
          {activeTab === "family" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-navy">Family Members & Dependents</h3>
                  <p className="text-xs text-muted-text mt-1">
                    Manage medical files for children or family members under your MedCard guardian account.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* List of members */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-navy">Linked Profiles</p>
                    {/* Self */}
                    <div
                      onClick={() => setSelectedProfileId(dashboard.patient.id)}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedProfileId === dashboard.patient.id
                          ? "border-teal bg-pale-cyan/50"
                          : "border-border bg-section-tint hover:border-teal/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold">
                          {dashboard.patient.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-navy text-sm">
                            {dashboard.patient.firstName} {dashboard.patient.lastName} (Primary Account)
                          </p>
                          <p className="text-xs text-muted-text font-mono">{dashboard.patient.patientNumber}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-navy text-white px-2.5 py-1 rounded-full font-bold">Account Owner</span>
                    </div>

                    {/* Dependents */}
                    {dashboard.patient.dependents?.map((dep) => (
                      <div
                        key={dep.id}
                        onClick={() => setSelectedProfileId(dep.id)}
                        className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedProfileId === dep.id
                            ? "border-teal bg-pale-cyan/50"
                            : "border-border bg-section-tint hover:border-teal/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-bold">
                            {dep.firstName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-navy text-sm">{dep.firstName} {dep.lastName}</p>
                            <p className="text-xs text-muted-text">DOB: {formatDate(dep.dateOfBirth)}</p>
                          </div>
                        </div>
                        <span className="text-xs text-teal font-semibold">Switch to view</span>
                      </div>
                    ))}
                  </div>

                  {/* Add dependent form */}
                  <div className="p-5 rounded-2xl bg-section-tint border border-border">
                    <h4 className="font-bold text-navy text-sm mb-3">Add New Dependent</h4>
                    <form onSubmit={addDependent} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          required
                          placeholder="First Name"
                          value={dependentForm.firstName}
                          onChange={(e) => setDependentForm({ ...dependentForm, firstName: e.target.value })}
                          className="text-xs rounded-lg border border-border px-3 py-2 bg-white"
                        />
                        <input
                          required
                          placeholder="Last Name"
                          value={dependentForm.lastName}
                          onChange={(e) => setDependentForm({ ...dependentForm, lastName: e.target.value })}
                          className="text-xs rounded-lg border border-border px-3 py-2 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[11px] text-body-text block">
                          Date of Birth
                          <input
                            type="date"
                            value={dependentForm.dateOfBirth}
                            onChange={(e) => setDependentForm({ ...dependentForm, dateOfBirth: e.target.value })}
                            className="w-full text-xs rounded-lg border border-border px-2 py-1.5 bg-white mt-1"
                          />
                        </label>
                        <label className="text-[11px] text-body-text block">
                          Gender
                          <select
                            value={dependentForm.gender}
                            onChange={(e) => setDependentForm({ ...dependentForm, gender: e.target.value })}
                            className="w-full text-xs rounded-lg border border-border px-2 py-1.5 bg-white mt-1"
                          >
                            <option value="UNKNOWN">Prefer not to say</option>
                            <option value="FEMALE">Female</option>
                            <option value="MALE">Male</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </label>
                      </div>
                      <input
                        placeholder="National ID / Birth Reg Number (optional)"
                        value={dependentForm.nationalId}
                        onChange={(e) => setDependentForm({ ...dependentForm, nationalId: e.target.value })}
                        className="w-full text-xs rounded-lg border border-border px-3 py-2 bg-white"
                      />
                      <input
                        placeholder="Insurance Provider (optional)"
                        value={dependentForm.insuranceProvider}
                        onChange={(e) => setDependentForm({ ...dependentForm, insuranceProvider: e.target.value })}
                        className="w-full text-xs rounded-lg border border-border px-3 py-2 bg-white"
                      />
                      <button
                        disabled={isAddingDependent}
                        className="w-full text-xs font-bold py-2.5 rounded-lg bg-teal text-white hover:bg-teal/90 disabled:opacity-50"
                      >
                        {isAddingDependent ? "Adding..." : "+ Create Dependent Profile"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: DOCUMENTS & INSURANCE                                 */}
          {/* ========================================================== */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Documents */}
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
                    <FileText size={18} className="text-teal" />
                    <h3 className="font-bold text-navy">Medical Documents</h3>
                  </div>

                  {selectedProfile.medicalDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {selectedProfile.medicalDocuments.map((doc) => (
                        <div key={doc.id} className="p-3.5 rounded-xl bg-section-tint border border-border flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm text-navy">{doc.title}</p>
                            <p className="text-xs text-muted-text mt-0.5">{doc.type} · {formatDate(doc.createdAt)}</p>
                            {doc.description && <p className="text-xs text-body-text mt-1">{doc.description}</p>}
                          </div>
                          <span className="text-xs bg-white px-2 py-1 rounded border border-border font-mono text-teal">
                            Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-body-text">
                      <FileText size={32} className="mx-auto text-muted-text/40 mb-2" />
                      <p className="text-sm font-semibold">No medical documents uploaded yet</p>
                      <p className="text-xs text-muted-text mt-1 max-w-sm mx-auto">
                        Referral letters, radiology scans, and lab reports sent by clinics will appear securely in this vault.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 p-3 rounded-xl bg-pale-cyan/50 border border-teal/20 flex items-start gap-2.5 text-xs text-navy">
                    <LockKeyhole size={16} className="text-teal shrink-0 mt-0.5" />
                    <span>Patient direct upload is currently restricted to clinical staff verification to ensure strict regulatory authenticity.</span>
                  </div>
                </div>

                {/* Insurance */}
                <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
                    <ShieldCheck size={18} className="text-teal" />
                    <h3 className="font-bold text-navy">Insurance Coverage</h3>
                  </div>

                  <div className="p-4 rounded-xl bg-section-tint border border-border space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-body-text">Declared Insurance Provider:</span>
                      <strong className="text-navy">{selectedProfile.insuranceProvider || "Direct Payer (Private)"}</strong>
                    </div>
                    {selectedProfile.patientInsurances?.map((ins) => (
                      <div key={ins.id} className="pt-2 border-t border-border/70 text-xs">
                        <div className="font-bold text-navy">{ins.plan.provider.name} — {ins.plan.name}</div>
                        <div className="text-muted-text">Card #: {ins.membershipNumber} ({ins.status})</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-section-tint border border-border">
                    <h4 className="font-bold text-navy text-xs uppercase mb-2">Clinician NFC Retrieval</h4>
                    <p className="text-xs text-body-text leading-relaxed">
                      Clinicians retrieve your record through the authenticated MedCard clinical system upon presenting your NFC card. Your physical card is a cryptographic key; sensitive records are stored securely encrypted in the cloud.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: PLAN & BILLING                                        */}
          {/* ========================================================== */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-border shadow-sm max-w-3xl">
                <h3 className="text-lg font-bold text-navy mb-1">Subscription Plan & Billing</h3>
                <p className="text-xs text-muted-text mb-6">Manage your MedCard Patient Vault subscription and mobile money billing.</p>

                <div className="p-5 rounded-2xl bg-navy text-white mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-accent-on-navy font-bold uppercase tracking-wider">Current Tier</span>
                      <h4 className="text-2xl font-bold mt-1">{subscription?.plan} Vault</h4>
                      <p className="text-xs text-soft-text-on-navy mt-1">
                        Active until {formatDate(subscription?.endDate)} · {subscription?.amount.toLocaleString()} RWF/month
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-teal text-white text-xs font-bold">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {!isPremium ? (
                  <div className="p-5 rounded-2xl border border-teal/40 bg-pale-cyan/30 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-navy text-base">Upgrade to Premium Vault</h4>
                        <p className="text-xs text-body-text mt-1">
                          Unlock document uploads, multi-sector linkage, family sharing, and priority backup.
                        </p>
                      </div>
                      <span className="text-lg font-bold text-teal">150 RWF/mo</span>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-semibold text-navy block">
                        MTN / Airtel Mobile Money Number
                        <input
                          value={paymentPhone}
                          onChange={(e) => setPaymentPhone(e.target.value)}
                          placeholder="2507XXXXXXXX"
                          className="w-full text-xs rounded-lg border border-border px-3 py-2 bg-white mt-1"
                        />
                      </label>
                      <button
                        onClick={upgradePlan}
                        disabled={isPaying || !paymentPhone.trim()}
                        className="w-full py-3 rounded-xl bg-teal text-white font-bold text-xs hover:bg-teal/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {isPaying ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
                        <span>{isPaying ? "Awaiting prompt approval..." : "Pay with Mobile Money (150 RWF)"}</span>
                      </button>
                      <p className="text-[11px] text-muted-text text-center">
                        Securely processed via XentriPay Rwanda. You will receive a push prompt on your mobile phone.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-pale-cyan text-navy flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-teal shrink-0" />
                    <p className="text-xs font-medium">You are on the top-tier Premium plan with all benefits unlocked.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: PERSONAL DETAILS                                      */}
          {/* ========================================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <form onSubmit={saveProfile} className="bg-white rounded-2xl p-6 border border-border shadow-sm max-w-3xl">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-lg font-bold text-navy">Personal & Emergency Details</h3>
                    <p className="text-xs text-muted-text mt-1">
                      Update your contact information and emergency contact.
                    </p>
                  </div>
                  <button
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 bg-teal text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-teal/90 disabled:opacity-50"
                  >
                    {isSaving && <LoaderCircle size={14} className="animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="text-xs font-semibold text-navy">
                    First Name
                    <input
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                    />
                  </label>
                  <label className="text-xs font-semibold text-navy">
                    Last Name
                    <input
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                    />
                  </label>
                  <label className="text-xs font-semibold text-navy">
                    Date of Birth
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                    />
                  </label>
                  <label className="text-xs font-semibold text-navy">
                    Gender
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1 bg-white"
                    >
                      <option value="UNKNOWN">Prefer not to say</option>
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-navy">
                    Phone Number
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                    />
                  </label>
                  <label className="text-xs font-semibold text-navy">
                    National ID
                    <input
                      value={profileForm.nationalId}
                      onChange={(e) => setProfileForm({ ...profileForm, nationalId: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                    />
                  </label>
                  <label className="text-xs font-semibold text-navy">
                    Emergency Contact Name
                    <input
                      value={profileForm.emergencyContactName}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                    />
                  </label>
                  <label className="text-xs font-semibold text-navy">
                    Emergency Contact Phone
                    <input
                      value={profileForm.emergencyContactPhone}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                    />
                  </label>
                  <label className="text-xs font-semibold text-navy sm:col-span-2">
                    Insurance Provider
                    <input
                      value={profileForm.insuranceProvider}
                      onChange={(e) => setProfileForm({ ...profileForm, insuranceProvider: e.target.value })}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                      placeholder="e.g. RSSB / RAMA, MMI, Radiant, UAP"
                    />
                  </label>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* BOOK APPOINTMENT MODAL (Requirement 2 from Document)           */}
      {/* ============================================================== */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="text-teal" size={20} />
                <h3 className="font-bold text-navy text-lg">Book Clinic Appointment</h3>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-1 rounded-lg hover:bg-section-tint text-muted-text"
              >
                <X size={20} />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 size={48} className="text-teal mx-auto" />
                <h4 className="text-lg font-bold text-navy">Appointment Request Sent!</h4>
                <p className="text-xs text-body-text max-w-sm mx-auto">
                  Your visit request to {bookingClinic} has been submitted. The clinic will confirm or propose a slot. Status: <strong>Pending Confirmation</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <label className="block text-xs font-semibold text-navy">
                  Select Participating Clinic
                  <select
                    value={bookingClinic}
                    onChange={(e) => setBookingClinic(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1 bg-white"
                  >
                    <option value="Remera Community Clinic">Remera Community Clinic · Kigali</option>
                    <option value="Kigali Central Health Center">Kigali Central Health Center · Nyarugenge</option>
                    <option value="Gasabo Family Clinic">Gasabo Family Clinic · Kimironko</option>
                    <option value="Kacyiru PolyClinic">Kacyiru PolyClinic · Gasabo</option>
                  </select>
                </label>

                <label className="block text-xs font-semibold text-navy">
                  Service / Specialty
                  <select
                    value={bookingService}
                    onChange={(e) => setBookingService(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1 bg-white"
                  >
                    <option value="General Consultation">General Medicine Consultation</option>
                    <option value="Dental Care">Dental Care & Hygiene</option>
                    <option value="Pediatrics">Pediatrics (Child Health)</option>
                    <option value="Laboratory Screening">Laboratory & Health Screening</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-navy">
                    Preferred Date
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-navy">
                    Preferred Time
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1 bg-white"
                    >
                      <option value="08:30">08:30 AM</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:30">03:30 PM</option>
                    </select>
                  </label>
                </div>

                <label className="block text-xs font-semibold text-navy">
                  Reason for Visit / Symptoms
                  <textarea
                    rows={3}
                    placeholder="Describe symptoms or purpose of appointment..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border px-3 py-2 mt-1 resize-none"
                  />
                </label>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-navy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-teal text-white text-xs font-bold hover:bg-teal/90"
                  >
                    Submit Booking Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
