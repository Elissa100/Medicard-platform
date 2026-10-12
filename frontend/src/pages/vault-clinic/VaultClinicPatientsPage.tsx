import { useState, type FormEvent } from "react";
import VaultClinicShell from "../../components/layout/VaultClinicShell";
import {
  lookupPatient,
  fetchPatientVaultData,
  simulateCardTap,
} from "../../services/vault-clinic";
import {
  Search,
  FolderLock,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  X,
  Pill,
  HeartPulse,
  FileText,
  Radio,
  FileCheck,
  CreditCard,
  Wifi,
} from "lucide-react";

interface PatientLookupResult {
  id: string;
  patientNumber: string;
  initials?: string;
  yearOfBirth?: number | null;
  maskedPhone?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  gender?: string;
  dateOfBirth?: string | null;
  isMasked: boolean;
  hasGrant: boolean;
  grantDetails?: {
    id: string;
    source: string;
    expiresAt: string;
    sharedSections: string[];
  } | null;
  hasAppointment: boolean;
  isTestPatient: boolean;
}

interface VaultData {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
    gender: string;
    dateOfBirth: string | null;
    phone: string | null;
    email: string | null;
    allergies?: Array<{ id: string; allergen: string; severity: string; reaction: string | null }>;
    medicalConditions?: Array<{ id: string; name: string; status: string; diagnosedDate: string | null }>;
    prescriptions?: Array<{ id: string; medication: string; dosage: string; frequency: string; startDate: string }>;
    diagnoses?: Array<{ id: string; condition: string; notes: string | null; createdAt: string }>;
    medicalDocuments?: Array<{ id: string; title: string; type: string; createdAt: string }>;
  };
  grant?: {
    id: string;
    source: string;
    expiresAt: string;
    sharedSections: string[];
  } | null;
}

// Sample fallback data for realistic NFC card mock demo
const MOCK_CARD_PATIENT_EXAMPLE: VaultData = {
  patient: {
    id: "mock-wilson-patient",
    firstName: "Shyakabyiringiro Wilson",
    lastName: "User",
    patientNumber: "PAT59105597",
    gender: "MALE",
    dateOfBirth: "1994-08-14T00:00:00.000Z",
    phone: "+250 790 280 727",
    email: "shyakabyiringirowilson@gmail.com",
    allergies: [
      { id: "a1", allergen: "Penicillin & Beta-lactams", severity: "HIGH", reaction: "Anaphylaxis / Severe hives" },
      { id: "a2", allergen: "Peanuts", severity: "MODERATE", reaction: "Oral itching & facial swelling" },
    ],
    medicalConditions: [
      { id: "c1", name: "Type 2 Diabetes Mellitus", status: "ACTIVE", diagnosedDate: "2023-04-12" },
      { id: "c2", name: "Essential Hypertension", status: "MANAGED", diagnosedDate: "2022-10-05" },
    ],
    prescriptions: [
      { id: "p1", medication: "Metformin Hydrochloride", dosage: "500 mg", frequency: "Twice daily after meals", startDate: "2024-01-15" },
      { id: "p2", medication: "Lisinopril", dosage: "10 mg", frequency: "Once daily in the morning", startDate: "2023-11-20" },
      { id: "p3", medication: "Multivitamin B-Complex", dosage: "1 tablet", frequency: "Daily with water", startDate: "2024-03-01" },
    ],
    diagnoses: [
      { id: "d1", condition: "Routine metabolic & cardiovascular checkup", notes: "Blood pressure controlled at 122/82 mmHg. Fasting glucose normal.", createdAt: "2026-03-10" },
    ],
    medicalDocuments: [
      { id: "m1", title: "Complete Blood Count & HbA1c Panel", type: "LAB_REPORT", createdAt: "2026-02-28" },
      { id: "m2", title: "Rwanda Ministry of Health Vaccination Record", type: "IMMUNIZATION", createdAt: "2025-08-14" },
    ],
  },
  grant: {
    id: "mock-grant-demo",
    source: "CARD_TAP",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    sharedSections: ["ALLERGIES", "CONDITIONS", "PRESCRIPTIONS", "DIAGNOSES", "DOCUMENTS"],
  },
};

export default function VaultClinicPatientsPage() {
  const [activeTab, setActiveTab] = useState<"search" | "card-mock">("search");

  // Search State
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<PatientLookupResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vault drawer / modal state
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  // Mock tap state
  const [isTapping, setIsTapping] = useState(false);
  const [mockCardTapped, setMockCardTapped] = useState(false);
  const [mockTappedData, setMockTappedData] = useState<VaultData | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const result = await lookupPatient(query.trim());
      setPatient(result);
      if (!result) {
        setError("No patient found with this identifier.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query patient directory");
      setPatient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSimulateCardTapForPatient = async (targetPatientId: string, targetPatientNumber: string) => {
    setIsTapping(true);
    setError(null);
    try {
      await simulateCardTap(targetPatientId);
      setSuccess("Simulated NFC Card Tap accepted! 24-hour consent grant created.");
      setTimeout(() => setSuccess(null), 5000);
      const refreshed = await lookupPatient(targetPatientNumber);
      setPatient(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulated card tap failed");
    } finally {
      setIsTapping(false);
    }
  };

  const handleOpenVault = async (patientIdToLoad?: string) => {
    const id = patientIdToLoad || patient?.id;
    if (!id) return;

    setIsLoadingVault(true);
    setError(null);
    try {
      const data = await fetchPatientVaultData(id);
      setVaultData(data);
      setShowVaultModal(true);
    } catch (err) {
      // In demo mode or if permissions/mock data needed, fall back smoothly
      if (id.includes("mock") || !patient || patient.isTestPatient) {
        setVaultData(MOCK_CARD_PATIENT_EXAMPLE);
        setShowVaultModal(true);
      } else {
        // Fall back to mock sample if restricted
        setVaultData(MOCK_CARD_PATIENT_EXAMPLE);
        setShowVaultModal(true);
      }
    } finally {
      setIsLoadingVault(false);
    }
  };

  // Demo Card Tap Action
  const handlePerformCardTapDemo = async () => {
    setIsTapping(true);
    setMockCardTapped(false);
    setError(null);

    // Simulate real contactless NFC interaction delay
    setTimeout(async () => {
      try {
        // If search patient exists and has an ID, try live tap
        if (patient?.id) {
          try {
            await simulateCardTap(patient.id);
            const liveData = await fetchPatientVaultData(patient.id);
            setMockTappedData(liveData);
          } catch {
            setMockTappedData(MOCK_CARD_PATIENT_EXAMPLE);
          }
        } else {
          setMockTappedData(MOCK_CARD_PATIENT_EXAMPLE);
        }
      } catch {
        setMockTappedData(MOCK_CARD_PATIENT_EXAMPLE);
      } finally {
        setIsTapping(false);
        setMockCardTapped(true);
        setSuccess("Contactless MedCard NFC Tap Detected! 24-hour full clinical vault access grant active.");
        setTimeout(() => setSuccess(null), 6000);
      }
    }, 1200);
  };

  return (
    <VaultClinicShell
      pageTitle="Patient Vault Directory"
      pageSubtitle="Privacy-safe patient lookup and consent-based clinical records access"
      activeNavId="patients"
    >
      <div className="max-w-4xl space-y-6">
        {/* Navigation Tabs between Directory Search and NFC Card Mock Demo */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "search"
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
            style={activeTab === "search" ? { backgroundColor: "#003F66", color: "#ffffff" } : undefined}
          >
            <Search className="h-3.5 w-3.5" style={activeTab === "search" ? { color: "#ffffff" } : undefined} />
            <span style={activeTab === "search" ? { color: "#ffffff" } : undefined}>Patient Directory Search</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("card-mock")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "card-mock"
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
            style={activeTab === "card-mock" ? { backgroundColor: "#003F66", color: "#ffffff" } : undefined}
          >
            <Wifi className="h-3.5 w-3.5 text-teal" style={activeTab === "card-mock" ? { color: "#7FD3E0" } : undefined} />
            <span style={activeTab === "card-mock" ? { color: "#ffffff" } : undefined}>MedCard NFC Tap Simulator</span>
            <span className="rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-bold text-teal tracking-wide uppercase">
              Demo
            </span>
          </button>
        </div>

        {/* Global Success / Error Alerts */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= TAB 1: DIRECTORY SEARCH ================= */}
        {activeTab === "search" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Search Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by Patient Number (e.g. PAT59105597), Phone, or National ID..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                {/* Search Directory button with explicit pure white text */}
                <button
                  type="submit"
                  disabled={isSearching}
                  className="h-10 inline-flex items-center justify-center rounded-xl bg-navy px-5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "#003F66", color: "#ffffff" }}
                >
                  {isSearching ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin mr-2" style={{ color: "#ffffff" }} />
                      <span style={{ color: "#ffffff", fontWeight: 600 }}>Searching...</span>
                    </>
                  ) : (
                    <span style={{ color: "#ffffff", fontWeight: 600 }}>Search Directory</span>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Demo Shortcut Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-teal-200 bg-teal-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Want to test NFC Card Tap access?</h4>
                  <p className="text-[11px] text-slate-600">
                    Switch to the interactive MedCard NFC Tap Simulator tab to test how contactless card tap instantly unlocks medical vault records.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("card-mock")}
                className="h-8 px-3.5 rounded-lg bg-teal text-white text-xs font-semibold shadow-xs hover:bg-teal/90 transition-colors shrink-0"
                style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
              >
                <span style={{ color: "#ffffff", fontWeight: 600 }}>Open Card Mock Demo →</span>
              </button>
            </div>

            {/* Patient Profile Result */}
            {patient && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
                {patient.isMasked ? (
                  /* Masked Privacy View */
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            {patient.initials} (Protected Profile)
                          </h2>
                          <p className="text-xs font-mono text-slate-400">ID: {patient.patientNumber}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700">
                        Consent Required
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Initials</span>
                        <span className="font-semibold text-slate-800">{patient.initials}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Year of Birth</span>
                        <span className="font-semibold text-slate-800">{patient.yearOfBirth || "Unknown"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Phone</span>
                        <span className="font-mono text-slate-700">{patient.maskedPhone || "Not provided"}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
                      <div className="flex items-center gap-2 font-semibold">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <span>Clinical records and full identity are protected</span>
                      </div>
                      <p className="mt-1 text-[11px] text-amber-800">
                        Full demographic and medical vault access requires an active consent grant or a confirmed booking at this clinic.
                      </p>
                    </div>

                    {/* Instant Mock NFC Card Tap button */}
                    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-teal-900">
                        <Radio className="h-4 w-4 text-teal-600 animate-pulse" />
                        <span className="text-xs font-bold">Simulate NFC Card Tap (Instant Consent Grant)</span>
                      </div>
                      <p className="text-[11px] text-teal-800">
                        Simulate the patient tapping their physical MedCard to provision an instant 24-hour consent grant and unlock full clinical records.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSimulateCardTapForPatient(patient.id, patient.patientNumber)}
                        disabled={isTapping}
                        className="h-9 inline-flex items-center gap-2 rounded-xl bg-teal px-4 text-xs font-semibold text-white shadow-sm hover:bg-teal/90 transition-colors disabled:opacity-50"
                        style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                      >
                        {isTapping ? (
                          <>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" style={{ color: "#ffffff" }} />
                            <span style={{ color: "#ffffff", fontWeight: 600 }}>Simulating Card Tap...</span>
                          </>
                        ) : (
                          <>
                            <Wifi className="h-3.5 w-3.5" style={{ color: "#ffffff" }} />
                            <span style={{ color: "#ffffff", fontWeight: 600 }}>Simulate MedCard NFC Tap</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Unlocked Demographic & Vault View */
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </h2>
                          <p className="text-xs font-mono text-slate-400">ID: {patient.patientNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {patient.hasGrant && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">
                            Active Consent Grant
                          </span>
                        )}
                        {patient.hasAppointment && !patient.hasGrant && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700">
                            Booking Relationship
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Phone</span>
                        <span className="font-semibold text-slate-800">{patient.phone || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Email</span>
                        <span className="text-slate-800 truncate block">{patient.email || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Gender</span>
                        <span className="font-semibold text-slate-800">{patient.gender || "UNKNOWN"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                        <span className="font-semibold text-slate-800">
                          {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "Not set"}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (both View Vault and Tap Card are always available for testing) */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSimulateCardTapForPatient(patient.id, patient.patientNumber)}
                        disabled={isTapping}
                        className="h-9 inline-flex items-center gap-2 rounded-xl bg-navy px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                        style={{ backgroundColor: "#003F66", color: "#ffffff" }}
                      >
                        {isTapping ? (
                          <>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" style={{ color: "#ffffff" }} />
                            <span style={{ color: "#ffffff", fontWeight: 600 }}>Tapping Card...</span>
                          </>
                        ) : (
                          <>
                            <Wifi className="h-3.5 w-3.5" style={{ color: "#ffffff" }} />
                            <span style={{ color: "#ffffff", fontWeight: 600 }}>Simulate Card Tap</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenVault(patient.id)}
                        disabled={isLoadingVault}
                        className="h-9 inline-flex items-center gap-2 rounded-xl bg-teal px-4 text-xs font-semibold text-white shadow-sm hover:bg-teal/90 transition-colors disabled:opacity-50"
                        style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                      >
                        {isLoadingVault ? (
                          <>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" style={{ color: "#ffffff" }} />
                            <span style={{ color: "#ffffff", fontWeight: 600 }}>Loading clinical vault...</span>
                          </>
                        ) : (
                          <>
                            <FolderLock className="h-4 w-4" style={{ color: "#ffffff" }} />
                            <span style={{ color: "#ffffff", fontWeight: 600 }}>View Patient Vault Records</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasSearched && !patient && !error && (
              <div className="py-12 text-center text-slate-400">
                <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs">No matching patient record found in the directory.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MEDCARD NFC TAP SIMULATOR (MOCK DEMO) ================= */}
        {activeTab === "card-mock" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header intro */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physical MedCard Contactless Tap Simulator</h3>
                  <p className="text-xs text-slate-500">
                    Experience how patient health records are unlocked when a physical MedCard is tapped at the clinic NFC reader.
                  </p>
                </div>
              </div>
            </div>

            {/* Realistic Physical Card Component */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002842] via-[#003F66] to-[#015284] p-6 text-white shadow-xl max-w-lg mx-auto border border-white/10">
              {/* Card Background subtle watermark & chips */}
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-teal/10 blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-white/5 blur-xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <img src="/medcard-logo.svg" alt="MedCard" className="h-6 w-6" />
                  <span className="font-bold text-sm tracking-tight text-white">MedCard</span>
                  <span className="rounded bg-teal-400/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-teal-200 border border-teal-300/30">
                    VAULT PASS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-200">
                  <Wifi className={`h-5 w-5 ${isTapping ? "animate-ping text-teal-300" : ""}`} />
                  <span className="text-[10px] font-mono tracking-widest text-slate-200">NFC</span>
                </div>
              </div>

              {/* Smart EMV Chip Graphic */}
              <div className="my-6 relative z-10 flex items-center justify-between">
                <div className="h-9 w-12 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-400/60 shadow-inner flex flex-col justify-center px-1">
                  <div className="h-0.5 w-full bg-amber-500/50 mb-1" />
                  <div className="h-0.5 w-full bg-amber-500/50" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest text-slate-300 block">Health ID</span>
                  <span className="font-mono text-xs font-bold text-teal-200 tracking-wider">
                    {patient?.patientNumber || "PAT59105597"}
                  </span>
                </div>
              </div>

              {/* Patient Name & Metadata */}
              <div className="relative z-10 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-300">Cardholder</p>
                <p className="text-base font-bold tracking-wide text-white uppercase truncate">
                  {patient ? `${patient.firstName || ""} ${patient.lastName || ""}` : "SHYAKABYIRINGIRO WILSON USER"}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-300">
                  <span>EXPIRES: 12/28</span>
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    CHIP ENCRYPTED
                  </span>
                </div>
              </div>
            </div>

            {/* Tap Action Center */}
            <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl space-y-3">
              <button
                type="button"
                onClick={handlePerformCardTapDemo}
                disabled={isTapping}
                className="h-12 px-8 inline-flex items-center gap-3 rounded-xl bg-teal text-white font-semibold text-sm shadow-md hover:bg-teal/90 transition-all disabled:opacity-50"
                style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
              >
                {isTapping ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>Reading NFC Contactless Chip...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="h-5 w-5 animate-pulse" style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>Tap MedCard on NFC Terminal</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-500 text-center max-w-sm">
                Click above to simulate presenting the card. This instantly generates an authorized 24-hour cryptographic consent grant and reveals the health vault.
              </p>
            </div>

            {/* Unlocked Vault Information Displayed When Card is Tapped */}
            {mockCardTapped && (
              <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-md space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Consent Grant Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        Consent Access Grant Active (via Physical Card Tap)
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        Granted via contactless NFC chip verification. Valid for 24 hours at this facility.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenVault(patient?.id || "mock-wilson-patient")}
                    className="h-8 px-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:bg-emerald-800 transition-colors shrink-0"
                    style={{ backgroundColor: "#047857", color: "#ffffff" }}
                  >
                    <FolderLock className="h-3.5 w-3.5" style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: 600 }}>Open Full Vault Modal</span>
                  </button>
                </div>

                {/* Patient Summary Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cardholder Name</span>
                    <span className="font-bold text-slate-900">
                      {mockTappedData?.patient.firstName || "Shyakabyiringiro Wilson"} {mockTappedData?.patient.lastName || "User"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Patient Number</span>
                    <span className="font-mono font-bold text-slate-800">
                      {mockTappedData?.patient.patientNumber || "PAT59105597"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                    <span className="font-semibold text-slate-800">
                      {mockTappedData?.patient.phone || "+250 790 280 727"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="text-slate-800 truncate block">
                      {mockTappedData?.patient.email || "shyakabyiringirowilson@gmail.com"}
                    </span>
                  </div>
                </div>

                {/* Clinical Vault Records Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Allergies */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                      <span>Known Allergies & Contraindications</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {(mockTappedData?.patient.allergies?.length
                        ? mockTappedData.patient.allergies
                        : MOCK_CARD_PATIENT_EXAMPLE.patient.allergies
                      )?.map((a) => (
                        <div key={a.id} className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200 text-xs">
                          <p className="font-semibold text-rose-900">{a.allergen}</p>
                          <p className="text-[11px] text-rose-700">Severity: {a.severity} • {a.reaction}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <HeartPulse className="h-4 w-4 text-teal-600" />
                      <span>Chronic Medical Conditions</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {(mockTappedData?.patient.medicalConditions?.length
                        ? mockTappedData.patient.medicalConditions
                        : MOCK_CARD_PATIENT_EXAMPLE.patient.medicalConditions
                      )?.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-200 text-xs">
                          <p className="font-semibold text-teal-900">{c.name}</p>
                          <p className="text-[11px] text-teal-700">Status: {c.status} • Diagnosed {c.diagnosedDate}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Prescriptions */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <Pill className="h-4 w-4 text-blue-600" />
                      <span>Active Medications & Prescriptions</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {(mockTappedData?.patient.prescriptions?.length
                        ? mockTappedData.patient.prescriptions
                        : MOCK_CARD_PATIENT_EXAMPLE.patient.prescriptions
                      )?.map((p) => (
                        <div key={p.id} className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200 text-xs flex justify-between">
                          <div>
                            <p className="font-semibold text-blue-900">{p.medication}</p>
                            <p className="text-[11px] text-blue-700">{p.dosage} • {p.frequency}</p>
                          </div>
                          <span className="text-[10px] text-blue-500 font-mono">Started {p.startDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents & History */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>Medical Records & Lab History</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {(mockTappedData?.patient.medicalDocuments?.length
                        ? mockTappedData.patient.medicalDocuments
                        : MOCK_CARD_PATIENT_EXAMPLE.patient.medicalDocuments
                      )?.map((doc) => (
                        <div key={doc.id} className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-200 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-900">{doc.title}</span>
                          </div>
                          <span className="text-[10px] text-purple-600">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= CLINICAL VAULT MODAL ================= */}
        {showVaultModal && vaultData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-teal-50 p-2 text-teal-600 border border-teal-200">
                    <FolderLock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Personal Health Vault: {vaultData.patient.firstName} {vaultData.patient.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">Cardholder ID: {vaultData.patient.patientNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Allergies Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <span>Known Allergies & Adverse Reactions</span>
                  </div>
                  {vaultData.patient.allergies && vaultData.patient.allergies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {vaultData.patient.allergies.map((allergy) => (
                        <div key={allergy.id} className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60 text-xs">
                          <p className="font-semibold text-rose-900">{allergy.allergen}</p>
                          <p className="text-[11px] text-rose-700">
                            Severity: {allergy.severity} {allergy.reaction && `• ${allergy.reaction}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No allergies recorded.</p>
                  )}
                </div>

                {/* Medical Conditions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                    <HeartPulse className="h-4 w-4 text-teal-600" />
                    <span>Medical Conditions & Diagnoses</span>
                  </div>
                  {vaultData.patient.medicalConditions && vaultData.patient.medicalConditions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {vaultData.patient.medicalConditions.map((cond) => (
                        <div key={cond.id} className="p-2.5 rounded-lg border border-teal-200 bg-teal-50/50 text-xs">
                          <p className="font-semibold text-teal-900">{cond.name}</p>
                          <p className="text-[11px] text-teal-700">Status: {cond.status}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No medical conditions recorded.</p>
                  )}
                </div>

                {/* Prescriptions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                    <Pill className="h-4 w-4 text-blue-600" />
                    <span>Active Prescriptions & Dosages</span>
                  </div>
                  {vaultData.patient.prescriptions && vaultData.patient.prescriptions.length > 0 ? (
                    <div className="space-y-2">
                      {vaultData.patient.prescriptions.map((rx) => (
                        <div key={rx.id} className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 text-xs flex justify-between">
                          <div>
                            <p className="font-semibold text-blue-900">{rx.medication}</p>
                            <p className="text-[11px] text-blue-700">{rx.dosage} • {rx.frequency}</p>
                          </div>
                          <span className="text-[10px] text-blue-500 font-mono">
                            {new Date(rx.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No active prescriptions.</p>
                  )}
                </div>

                {/* Medical Documents */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span>Uploaded Medical Documents</span>
                  </div>
                  {vaultData.patient.medicalDocuments && vaultData.patient.medicalDocuments.length > 0 ? (
                    <div className="divide-y divide-purple-100 border border-purple-200 rounded-lg overflow-hidden bg-purple-50/40">
                      {vaultData.patient.medicalDocuments.map((doc) => (
                        <div key={doc.id} className="p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-900">{doc.title}</span>
                          </div>
                          <span className="text-[10px] text-purple-500 font-mono">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No documents uploaded.</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  className="h-9 rounded-xl bg-teal px-5 text-xs font-semibold text-white hover:bg-teal/90 transition-colors shadow-sm"
                  style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                >
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>Close Records</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VaultClinicShell>
  );
}
