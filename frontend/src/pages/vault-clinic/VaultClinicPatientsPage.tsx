import { useState, type FormEvent } from "react";
import VaultClinicShell from "../../components/layout/VaultClinicShell";
import {
  lookupPatient,
  fetchPatientVaultData,
  simulateCardTap,
  getVaultClinicStaff,
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

export default function VaultClinicPatientsPage() {
  const currentStaff = getVaultClinicStaff();
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

  const handleSimulateCardTap = async () => {
    if (!patient) return;
    setIsTapping(true);
    setError(null);
    try {
      await simulateCardTap(patient.id);
      setSuccess("Simulated NFC Card Tap accepted! 24-hour consent grant created.");
      setTimeout(() => setSuccess(null), 5000);
      // Re-run lookup to get unlocked details and active grant
      const refreshed = await lookupPatient(patient.patientNumber);
      setPatient(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulated card tap failed");
    } finally {
      setIsTapping(false);
    }
  };

  const handleOpenVault = async () => {
    if (!patient) return;
    setIsLoadingVault(true);
    setError(null);
    try {
      const data = await fetchPatientVaultData(patient.id);
      setVaultData(data);
      setShowVaultModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinical records");
    } finally {
      setIsLoadingVault(false);
    }
  };

  const isClinician = currentStaff?.role === "CLINICIAN";

  return (
    <VaultClinicShell
      pageTitle="Patient Vault Directory"
      pageSubtitle="Privacy-safe patient lookup and consent-based clinical records access"
      activeNavId="patients"
    >
      <div className="max-w-4xl space-y-6">
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
                placeholder="Search by Patient Number (e.g. MC-1234), Phone, or National ID..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="h-10 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isSearching ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                "Search Directory"
              )}
            </button>
          </form>
        </div>

        {/* Alerts */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

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

                {/* Simulated Card Tap (Flag-guarded, test patients only, clinicians only) */}
                {patient.isTestPatient && isClinician && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-teal-900">
                      <Radio className="h-4 w-4 text-teal-600 animate-pulse" />
                      <span className="text-xs font-bold">NFC Card Tap Simulator (Test Patient)</span>
                    </div>
                    <p className="text-[11px] text-teal-800">
                      This patient is marked as a test account. You may simulate an in-person physical card tap to provision an instant 24-hour consent grant.
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulateCardTap}
                      disabled={isTapping}
                      className="h-9 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors disabled:opacity-50"
                    >
                      {isTapping ? (
                        <>
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          Simulating Card Tap...
                        </>
                      ) : (
                        <>
                          <Radio className="h-3.5 w-3.5" />
                          Simulate NFC Card Tap
                        </>
                      )}
                    </button>
                  </div>
                )}
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
                    <span className="font-semibold text-slate-800">{patient.gender || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-slate-800">
                      {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "Not set"}
                    </span>
                  </div>
                </div>

                {isClinician ? (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleOpenVault}
                      disabled={isLoadingVault}
                      className="h-9 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {isLoadingVault ? (
                        <>
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          Loading clinical vault...
                        </>
                      ) : (
                        <>
                          <FolderLock className="h-4 w-4" />
                          View Patient Vault Records
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Clinical record viewing is restricted to authorized clinicians. Receptionists see basic demographic info only.
                  </p>
                )}
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

        {/* Clinical Vault Modal */}
        {showVaultModal && vaultData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                    <FolderLock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Personal Health Vault: {vaultData.patient.firstName} {vaultData.patient.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {vaultData.patient.patientNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
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
                    <span>Known Allergies</span>
                  </div>
                  {vaultData.patient.allergies && vaultData.patient.allergies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {vaultData.patient.allergies.map((allergy) => (
                        <div key={allergy.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                          <p className="font-semibold text-slate-800">{allergy.allergen}</p>
                          <p className="text-[11px] text-slate-500">
                            Severity: {allergy.severity} {allergy.reaction && `• Reaction: ${allergy.reaction}`}
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
                        <div key={cond.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                          <p className="font-semibold text-slate-800">{cond.name}</p>
                          <p className="text-[11px] text-slate-500">Status: {cond.status}</p>
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
                    <span>Active Prescriptions & Medications</span>
                  </div>
                  {vaultData.patient.prescriptions && vaultData.patient.prescriptions.length > 0 ? (
                    <div className="space-y-2">
                      {vaultData.patient.prescriptions.map((rx) => (
                        <div key={rx.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{rx.medication}</p>
                            <p className="text-[11px] text-slate-500">{rx.dosage} • {rx.frequency}</p>
                          </div>
                          <span className="text-[10px] text-slate-400">
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
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {vaultData.patient.medicalDocuments.map((doc) => (
                        <div key={doc.id} className="p-2.5 bg-slate-50 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-slate-800">{doc.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
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
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  className="h-8 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
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

