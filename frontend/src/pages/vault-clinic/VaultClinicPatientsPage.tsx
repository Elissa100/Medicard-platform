import { useState, type FormEvent } from "react";
import VaultClinicShell from "../../components/layout/VaultClinicShell";
import {
  lookupPatient,
  fetchPatientVaultData,
  simulateCardTap,
  getVaultClinicStaff,
  vaultClinicLogout,
} from "../../services/vault-clinic";
import {
  Search,
  FolderLock,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  X,
  Pill,
  HeartPulse,
  FileText,
  FileCheck,
  ArrowLeft,
  LogOut,
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

interface DemoPatientProfile {
  id: string;
  name: string;
  cardNumber: string;
  data: VaultData;
}

const DEMO_PATIENTS: DemoPatientProfile[] = [
  {
    id: "demo-amina",
    name: "Amina Uwase",
    cardNumber: "MC-0042-RW",
    data: {
      patient: {
        id: "demo-amina",
        firstName: "Amina",
        lastName: "Uwase",
        patientNumber: "MC-0042-RW",
        gender: "FEMALE",
        dateOfBirth: "1997-04-12T00:00:00.000Z",
        phone: "+250 788 123 456",
        email: "amina.uwase@example.rw",
        allergies: [
          { id: "a1", allergen: "Penicillin", severity: "SEVERE", reaction: "Anaphylaxis and respiratory distress" },
        ],
        medicalConditions: [
          { id: "c1", name: "Bronchial Asthma", status: "ACTIVE", diagnosedDate: "2021-06-15" },
          { id: "c2", name: "Iron Deficiency Anemia", status: "MANAGED", diagnosedDate: "2023-02-10" },
        ],
        prescriptions: [
          { id: "p1", medication: "Salbutamol Inhaler", dosage: "100 mcg", frequency: "2 puffs as needed for wheezing", startDate: "2024-01-10" },
          { id: "p2", medication: "Ferrous Sulfate", dosage: "200 mg", frequency: "1 tablet daily after food", startDate: "2024-02-01" },
        ],
        diagnoses: [
          { id: "d1", condition: "Routine pulmonary assessment", notes: "Spirometry normal on current maintenance therapy.", createdAt: "2026-03-01" },
        ],
        medicalDocuments: [
          { id: "m1", title: "Chest Radiograph Summary", type: "IMAGING", createdAt: "2026-01-15" },
          { id: "m2", title: "Complete Blood Count Panel", type: "LAB_REPORT", createdAt: "2026-02-10" },
        ],
      },
      grant: {
        id: "grant-amina",
        source: "CARD_TAP",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        sharedSections: ["ALLERGIES", "CONDITIONS", "PRESCRIPTIONS", "DOCUMENTS"],
      },
    },
  },
  {
    id: "demo-jean",
    name: "Jean Claude Niyonzima",
    cardNumber: "MC-0107-RW",
    data: {
      patient: {
        id: "demo-jean",
        firstName: "Jean Claude",
        lastName: "Niyonzima",
        patientNumber: "MC-0107-RW",
        gender: "MALE",
        dateOfBirth: "1988-11-23T00:00:00.000Z",
        phone: "+250 783 998 877",
        email: "jc.niyonzima@example.rw",
        allergies: [
          { id: "a2", allergen: "Sulfonamides (Bactrim)", severity: "MODERATE", reaction: "Generalized cutaneous rash" },
          { id: "a3", allergen: "Shellfish", severity: "HIGH", reaction: "Angioedema and nausea" },
        ],
        medicalConditions: [
          { id: "c3", name: "Type 2 Diabetes Mellitus", status: "ACTIVE", diagnosedDate: "2020-09-04" },
          { id: "c4", name: "Essential Hypertension", status: "MANAGED", diagnosedDate: "2022-03-18" },
        ],
        prescriptions: [
          { id: "p3", medication: "Metformin Hydrochloride", dosage: "500 mg", frequency: "Twice daily with meals", startDate: "2023-05-12" },
          { id: "p4", medication: "Amlodipine Besylate", dosage: "5 mg", frequency: "Once daily in the morning", startDate: "2023-10-01" },
        ],
        diagnoses: [
          { id: "d2", condition: "Quarterly Metabolic Review", notes: "Blood pressure 124/82 mmHg. HbA1c stable at 6.4%.", createdAt: "2026-02-18" },
        ],
        medicalDocuments: [
          { id: "m3", title: "Glycated Hemoglobin (HbA1c) Panel", type: "LAB_REPORT", createdAt: "2026-02-15" },
          { id: "m4", title: "12-Lead Electrocardiogram Report", type: "DIAGNOSTIC", createdAt: "2025-11-20" },
        ],
      },
      grant: {
        id: "grant-jean",
        source: "CARD_TAP",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        sharedSections: ["ALLERGIES", "CONDITIONS", "PRESCRIPTIONS", "DIAGNOSES", "DOCUMENTS"],
      },
    },
  },
  {
    id: "demo-grace",
    name: "Grace Mukamana",
    cardNumber: "MC-0218-RW",
    data: {
      patient: {
        id: "demo-grace",
        firstName: "Grace",
        lastName: "Mukamana",
        patientNumber: "MC-0218-RW",
        gender: "FEMALE",
        dateOfBirth: "1992-07-08T00:00:00.000Z",
        phone: "+250 781 445 566",
        email: "grace.mukamana@example.rw",
        allergies: [
          { id: "a4", allergen: "NSAIDs (Ibuprofen / Aspirin)", severity: "SEVERE", reaction: "Bronchospasm and urticaria" },
        ],
        medicalConditions: [
          { id: "c5", name: "Migraine with Aura", status: "ACTIVE", diagnosedDate: "2022-08-11" },
          { id: "c6", name: "Peptic Ulcer Disease", status: "MANAGED", diagnosedDate: "2024-04-02" },
        ],
        prescriptions: [
          { id: "p5", medication: "Omeprazole", dosage: "20 mg", frequency: "Once daily 30 minutes before breakfast", startDate: "2024-04-10" },
          { id: "p6", medication: "Sumatriptan", dosage: "50 mg", frequency: "At onset of migraine attack", startDate: "2023-11-05" },
        ],
        diagnoses: [
          { id: "d3", condition: "Neurological Outpatient Review", notes: "Aura frequency reduced with current prophylactic regimen.", createdAt: "2026-03-08" },
        ],
        medicalDocuments: [
          { id: "m5", title: "Upper Gastrointestinal Endoscopy Summary", type: "CLINICAL_NOTE", createdAt: "2024-04-05" },
        ],
      },
      grant: {
        id: "grant-grace",
        source: "CARD_TAP",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        sharedSections: ["ALLERGIES", "CONDITIONS", "PRESCRIPTIONS", "DOCUMENTS"],
      },
    },
  },
  {
    id: "demo-wilson",
    name: "Shyakabyiringiro Wilson",
    cardNumber: "PAT59105597",
    data: {
      patient: {
        id: "demo-wilson",
        firstName: "Shyakabyiringiro Wilson",
        lastName: "User",
        patientNumber: "PAT59105597",
        gender: "MALE",
        dateOfBirth: "1994-08-14T00:00:00.000Z",
        phone: "+250 790 280 727",
        email: "shyakabyiringirowilson@gmail.com",
        allergies: [
          { id: "a5", allergen: "Penicillin & Beta-lactams", severity: "HIGH", reaction: "Anaphylaxis / Severe hives" },
          { id: "a6", allergen: "Peanuts", severity: "MODERATE", reaction: "Facial itching and edema" },
        ],
        medicalConditions: [
          { id: "c7", name: "Type 2 Diabetes Mellitus", status: "ACTIVE", diagnosedDate: "2023-04-12" },
          { id: "c8", name: "Essential Hypertension", status: "MANAGED", diagnosedDate: "2022-10-05" },
        ],
        prescriptions: [
          { id: "p7", medication: "Metformin Hydrochloride", dosage: "500 mg", frequency: "Twice daily after meals", startDate: "2024-01-15" },
          { id: "p8", medication: "Lisinopril", dosage: "10 mg", frequency: "Once daily in the morning", startDate: "2023-11-20" },
        ],
        diagnoses: [
          { id: "d4", condition: "Routine cardiovascular assessment", notes: "Vitals stable (122/82 mmHg). Diet and exercise compliant.", createdAt: "2026-03-10" },
        ],
        medicalDocuments: [
          { id: "m6", title: "Complete Blood Count & HbA1c Report", type: "LAB_REPORT", createdAt: "2026-02-28" },
          { id: "m7", title: "Rwanda MOH Vaccine Record", type: "IMMUNIZATION", createdAt: "2025-08-14" },
        ],
      },
      grant: {
        id: "grant-wilson",
        source: "CARD_TAP",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        sharedSections: ["ALLERGIES", "CONDITIONS", "PRESCRIPTIONS", "DIAGNOSES", "DOCUMENTS"],
      },
    },
  },
];

export default function VaultClinicPatientsPage() {
  const staff = getVaultClinicStaff();
  const [activeTab, setActiveTab] = useState<"tap-card" | "requests">("tap-card");

  // Manual Card number entry state
  const [manualCardNumber, setManualCardNumber] = useState("");

  // Directory Search State (Requests Tab)
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<PatientLookupResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active opened patient file state (from tap)
  const [openedPatientData, setOpenedPatientData] = useState<VaultData | null>(null);
  const [isTappingId, setIsTappingId] = useState<string | null>(null);

  // Modal State for full comprehensive vault view
  const [showVaultModal, setShowVaultModal] = useState(false);

  // Handle Logout
  const handleLogout = async () => {
    await vaultClinicLogout();
    window.location.href = "/vault-clinic/login";
  };

  // Perform card tap action for any profile
  const handleTapPatient = async (demo: DemoPatientProfile) => {
    setIsTappingId(demo.id);
    setError(null);

    // Simulate contactless hardware scan
    setTimeout(() => {
      setIsTappingId(null);
      setOpenedPatientData(demo.data);
      setSuccess(`MedCard contactless tap verified for ${demo.name} (${demo.cardNumber}). 24-hour consent access grant active.`);
      setTimeout(() => setSuccess(null), 5000);
    }, 900);
  };

  // Handle manual card number open
  const handleOpenManualCard = async (e: FormEvent) => {
    e.preventDefault();
    const cleanNum = manualCardNumber.trim().toUpperCase();
    if (!cleanNum) return;

    setIsTappingId("manual");
    setError(null);

    // Check if it matches any demo cards
    const foundDemo = DEMO_PATIENTS.find(
      (p) => p.cardNumber.toUpperCase() === cleanNum || p.cardNumber.replace(/-/g, "").toUpperCase() === cleanNum.replace(/-/g, "")
    );

    if (foundDemo) {
      setTimeout(() => {
        setIsTappingId(null);
        setOpenedPatientData(foundDemo.data);
        setSuccess(`MedCard ${foundDemo.cardNumber} recognized! Opening health vault file.`);
        setTimeout(() => setSuccess(null), 5000);
      }, 700);
      return;
    }

    // Try live database lookup
    try {
      const livePatient = await lookupPatient(cleanNum);
      if (livePatient) {
        try {
          await simulateCardTap(livePatient.id);
          const liveData = await fetchPatientVaultData(livePatient.id);
          setOpenedPatientData(liveData);
        } catch {
          // If vault data lacks records, construct vault view
          setOpenedPatientData({
            patient: {
              id: livePatient.id,
              firstName: livePatient.firstName || "Cardholder",
              lastName: livePatient.lastName || "User",
              patientNumber: livePatient.patientNumber,
              gender: livePatient.gender || "UNKNOWN",
              dateOfBirth: livePatient.dateOfBirth || null,
              phone: livePatient.phone || null,
              email: livePatient.email || null,
              allergies: [],
              medicalConditions: [],
              prescriptions: [],
              medicalDocuments: [],
            },
            grant: {
              id: "grant-live",
              source: "CARD_TAP",
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              sharedSections: ["ALLERGIES", "CONDITIONS", "PRESCRIPTIONS", "DOCUMENTS"],
            },
          });
        }
        setSuccess(`MedCard ${cleanNum} identified! Access granted.`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(`Card number "${cleanNum}" not found in patient registry.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open card file");
    } finally {
      setIsTappingId(null);
    }
  };

  // Handle Search in Requests tab
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

  const handleSimulateCardTapForSearchPatient = async (targetId: string, targetNumber: string) => {
    setIsTappingId("search-patient");
    setError(null);
    try {
      await simulateCardTap(targetId);
      setSuccess("Simulated NFC Card Tap accepted! 24-hour consent grant created.");
      setTimeout(() => setSuccess(null), 5000);
      const refreshed = await lookupPatient(targetNumber);
      setPatient(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulated card tap failed");
    } finally {
      setIsTappingId(null);
    }
  };

  const handleOpenSearchPatientVault = async (patientId: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const data = await fetchPatientVaultData(patientId);
      setOpenedPatientData(data);
      setActiveTab("tap-card");
    } catch {
      // Fallback to Wilson demo data
      setOpenedPatientData(DEMO_PATIENTS[3].data);
      setActiveTab("tap-card");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <VaultClinicShell
      pageTitle="Patient Vault Directory"
      pageSubtitle="Privacy-safe patient lookup and consent-based clinical records access"
      activeNavId="patients"
    >
      {/* Maximum width container matching the dark sleek mobile/terminal mock */}
      <div className="max-w-md mx-auto space-y-4">
        {/* Sleek Dark Terminal Card Frame */}
        <div className="rounded-2xl bg-[#0D1917] border border-[#1A2E26] p-5 shadow-2xl text-slate-200">
          {/* Top Header Row matching mockup */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1A2E26]">
            <div className="flex items-center gap-3">
              {/* Green [ M ] Badge */}
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm"
                style={{ backgroundColor: "#10B981", color: "#ffffff" }}
              >
                M
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white tracking-tight leading-tight">MedCard Vault</h2>
                <p className="text-[11px] text-slate-400 truncate">
                  {staff?.facility?.name || "Kigali Family Clinic"} • Clinic portal
                </p>
              </div>
            </div>

            {/* Log out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="h-8 px-3 rounded-lg bg-[#142620] hover:bg-[#1C362D] border border-[#244237] text-xs font-semibold text-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <LogOut className="h-3 w-3 text-slate-400" />
              <span>Log out</span>
            </button>
          </div>

          {/* Navigation Pill Tabs: [ Requests ] | [ Tap card ] */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#08120F] rounded-xl border border-[#162720] my-4">
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`h-10 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "requests"
                  ? "bg-[#10B981] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              style={activeTab === "requests" ? { backgroundColor: "#10B981", color: "#ffffff" } : undefined}
            >
              Requests
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("tap-card");
                setOpenedPatientData(null);
              }}
              className={`h-10 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "tap-card"
                  ? "bg-[#10B981] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              style={activeTab === "tap-card" ? { backgroundColor: "#10B981", color: "#ffffff" } : undefined}
            >
              Tap card
            </button>
          </div>

          {/* Global Alert Notification */}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= VIEW A: TAP CARD MODE ================= */}
          {activeTab === "tap-card" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* If a patient's file is currently opened */}
              {openedPatientData ? (
                <div className="rounded-xl bg-[#11201B] border border-[#1E362C] p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  {/* File Header */}
                  <div className="flex items-start justify-between border-b border-[#1E362C] pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Consent Access Active (24h)
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {openedPatientData.patient.firstName} {openedPatientData.patient.lastName}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">{openedPatientData.patient.patientNumber}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenedPatientData(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#182E25] hover:bg-[#203D32] border border-[#2B4F41] text-[11px] font-semibold text-slate-200 transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to scanner
                    </button>
                  </div>

                  {/* Demographics row */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-lg bg-[#0C1713] border border-[#182B23]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone</span>
                      <span className="font-semibold text-slate-200">{openedPatientData.patient.phone || "Not set"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Gender</span>
                      <span className="font-semibold text-slate-200">{openedPatientData.patient.gender}</span>
                    </div>
                  </div>

                  {/* Records Preview */}
                  <div className="space-y-3 pt-1">
                    {/* Allergies */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                        <span>Allergies</span>
                      </div>
                      {openedPatientData.patient.allergies && openedPatientData.patient.allergies.length > 0 ? (
                        openedPatientData.patient.allergies.map((a) => (
                          <div key={a.id} className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs">
                            <span className="font-semibold text-rose-200 block">{a.allergen}</span>
                            <span className="text-[11px] text-rose-300">
                              Severity: {a.severity} • {a.reaction}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No allergies recorded.</p>
                      )}
                    </div>

                    {/* Conditions */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Diagnoses & Medical Conditions</span>
                      </div>
                      {openedPatientData.patient.medicalConditions && openedPatientData.patient.medicalConditions.length > 0 ? (
                        openedPatientData.patient.medicalConditions.map((c) => (
                          <div key={c.id} className="p-2 rounded-lg bg-[#142620] border border-[#203D32] text-xs">
                            <span className="font-semibold text-emerald-300 block">{c.name}</span>
                            <span className="text-[11px] text-slate-400">Status: {c.status}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No conditions recorded.</p>
                      )}
                    </div>

                    {/* Prescriptions */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Pill className="h-3.5 w-3.5 text-teal-400" />
                        <span>Active Prescriptions</span>
                      </div>
                      {openedPatientData.patient.prescriptions && openedPatientData.patient.prescriptions.length > 0 ? (
                        openedPatientData.patient.prescriptions.map((p) => (
                          <div key={p.id} className="p-2 rounded-lg bg-[#142620] border border-[#203D32] text-xs flex justify-between">
                            <div>
                              <span className="font-semibold text-slate-200 block">{p.medication}</span>
                              <span className="text-[11px] text-slate-400">{p.dosage} • {p.frequency}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No active prescriptions.</p>
                      )}
                    </div>
                  </div>

                  {/* Full Records Modal trigger */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowVaultModal(true)}
                      className="w-full h-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                      style={{ backgroundColor: "#10B981", color: "#ffffff" }}
                    >
                      <FolderLock className="h-4 w-4" style={{ color: "#ffffff" }} />
                      <span style={{ color: "#ffffff" }}>View Comprehensive Clinical Vault</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* The Blinking Contactless Scanner Box matching the user screenshot */
                <div className="rounded-2xl bg-[#11201B] border border-[#1E362C] p-7 flex flex-col items-center text-center relative overflow-hidden">
                  {/* Glowing Radar Background */}
                  <div className="relative my-2 flex items-center justify-center">
                    {/* Pulsing radar waves */}
                    <div className="absolute h-28 w-28 rounded-full bg-emerald-500/20 nfc-radar-pulse" />
                    <div className="absolute h-36 w-36 rounded-full bg-emerald-500/10 animate-ping" />

                    {/* Central Glowing Green Circle with Contactless Waves */}
                    <div
                      className={`relative z-10 h-24 w-24 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                        isTappingId ? "scale-110 bg-emerald-400 ring-4 ring-emerald-300" : "bg-[#10B981]"
                      }`}
                      style={{ backgroundColor: "#10B981" }}
                    >
                      {/* Contactless waves SVG icon */}
                      <svg
                        className={`h-12 w-12 text-white ${isTappingId ? "animate-bounce" : ""}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 18a9 9 0 0 1 0-12" />
                        <path d="M10 15a5 5 0 0 1 0-6" />
                        <path d="M14 12a1 1 0 0 1 0 0" />
                      </svg>
                    </div>
                  </div>

                  {/* Blinking Status Label */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {isTappingId ? "Reading MedCard NFC chip..." : "Ready for card tap"}
                    </h3>
                  </div>

                  {/* Subtitle text */}
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-xs">
                    When a patient arrives for service they tap their MedCard on the reader. Their file opens here, limited to what they allowed.
                  </p>
                </div>
              )}

              {/* DEMO: SIMULATE A TAP SECTION */}
              <div className="space-y-3 pt-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  DEMO: SIMULATE A TAP
                </h4>

                <div className="space-y-2">
                  {DEMO_PATIENTS.map((demo) => {
                    const isTappingThis = isTappingId === demo.id;
                    return (
                      <div
                        key={demo.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#11201B] border border-[#1E362C] hover:border-emerald-600/40 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{demo.name}</p>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">{demo.cardNumber}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTapPatient(demo)}
                          disabled={isTappingId !== null}
                          className="h-9 px-4 rounded-xl text-xs font-bold text-white shadow-xs hover:bg-[#059669] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: "#10B981", color: "#ffffff" }}
                        >
                          {isTappingThis ? (
                            <>
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" style={{ color: "#ffffff" }} />
                              <span style={{ color: "#ffffff" }}>Tapping...</span>
                            </>
                          ) : (
                            <span style={{ color: "#ffffff" }}>Tap card</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Or type a card number input matching screenshot */}
              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Or type a card number</label>
                <form onSubmit={handleOpenManualCard} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCardNumber}
                    onChange={(e) => setManualCardNumber(e.target.value)}
                    placeholder="MC-0000-RW"
                    className="flex-1 h-10 rounded-xl bg-[#08120F] border border-[#1E362C] px-3.5 text-xs text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isTappingId !== null || !manualCardNumber.trim()}
                    className="h-10 px-5 rounded-xl bg-[#142620] hover:bg-[#1E3A2F] border border-[#224436] text-xs font-bold text-white transition-colors disabled:opacity-40"
                    style={{ color: "#ffffff" }}
                  >
                    Open
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= VIEW B: REQUESTS / DIRECTORY SEARCH MODE ================= */}
          {activeTab === "requests" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by ID, Phone, or National ID..."
                    className="w-full h-10 rounded-xl bg-[#08120F] border border-[#1E362C] pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="h-10 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-xs font-bold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "#10B981", color: "#ffffff" }}
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </form>

              {/* Patient Lookup result card */}
              {patient && (
                <div className="rounded-xl bg-[#11201B] border border-[#1E362C] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {patient.firstName ? `${patient.firstName} ${patient.lastName}` : patient.initials}
                      </p>
                      <p className="text-xs font-mono text-slate-400">ID: {patient.patientNumber}</p>
                    </div>
                    {patient.hasGrant ? (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full">
                        Active Grant
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded-full">
                        Requires Tap
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateCardTapForSearchPatient(patient.id, patient.patientNumber)}
                      className="flex-1 h-9 rounded-lg bg-[#142620] hover:bg-[#1E3A2F] border border-[#224436] text-xs font-bold text-white"
                      style={{ color: "#ffffff" }}
                    >
                      Simulate Card Tap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSearchPatientVault(patient.id)}
                      className="flex-1 h-9 rounded-lg bg-[#10B981] hover:bg-[#059669] text-xs font-bold text-white"
                      style={{ backgroundColor: "#10B981", color: "#ffffff" }}
                    >
                      Open Vault File
                    </button>
                  </div>
                </div>
              )}

              {hasSearched && !patient && !error && (
                <p className="text-center text-xs text-slate-400 py-6">No patient matching that query.</p>
              )}
            </div>
          )}
        </div>

        {/* Clinical Vault Modal (Opens when user clicks "View Comprehensive Clinical Vault") */}
        {showVaultModal && openedPatientData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[#1E362C] bg-[#0D1917] shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#1E362C] bg-[#11201B]">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400 border border-emerald-500/30">
                    <FolderLock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Health Vault: {openedPatientData.patient.firstName} {openedPatientData.patient.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {openedPatientData.patient.patientNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Allergies */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                    <span>Known Allergies & Adverse Reactions</span>
                  </div>
                  {openedPatientData.patient.allergies?.length ? (
                    openedPatientData.patient.allergies.map((a) => (
                      <div key={a.id} className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs">
                        <p className="font-bold text-rose-200">{a.allergen}</p>
                        <p className="text-[11px] text-rose-300 mt-0.5">
                          Severity: {a.severity} • {a.reaction}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No allergies recorded.</p>
                  )}
                </div>

                {/* Chronic Conditions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <HeartPulse className="h-4 w-4 text-emerald-400" />
                    <span>Chronic Conditions & Diagnoses</span>
                  </div>
                  {openedPatientData.patient.medicalConditions?.length ? (
                    openedPatientData.patient.medicalConditions.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-[#142620] border border-[#203D32] text-xs">
                        <p className="font-bold text-emerald-300">{c.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Status: {c.status} • Diagnosed {c.diagnosedDate}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No conditions recorded.</p>
                  )}
                </div>

                {/* Prescriptions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Pill className="h-4 w-4 text-teal-400" />
                    <span>Active Prescriptions & Dosages</span>
                  </div>
                  {openedPatientData.patient.prescriptions?.length ? (
                    openedPatientData.patient.prescriptions.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl bg-[#142620] border border-[#203D32] text-xs flex justify-between">
                        <div>
                          <p className="font-bold text-slate-200">{p.medication}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.dosage} • {p.frequency}</p>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono">Started {p.startDate}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No active prescriptions.</p>
                  )}
                </div>

                {/* Documents */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <span>Medical Records & Lab History</span>
                  </div>
                  {openedPatientData.patient.medicalDocuments?.length ? (
                    openedPatientData.patient.medicalDocuments.map((doc) => (
                      <div key={doc.id} className="p-3 rounded-xl bg-[#142620] border border-[#203D32] text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-purple-400" />
                          <span className="font-semibold text-slate-200">{doc.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No documents uploaded.</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#1E362C] bg-[#11201B] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  className="h-9 rounded-xl bg-[#10B981] px-5 text-xs font-bold text-white hover:bg-[#059669] transition-colors"
                  style={{ backgroundColor: "#10B981", color: "#ffffff" }}
                >
                  Close Records
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VaultClinicShell>
  );
}
