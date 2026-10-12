import { useState, useEffect, useCallback, type FormEvent } from "react";
import VaultClinicShell from "../../components/layout/VaultClinicShell";
import {
  fetchClinicAppointments,
  confirmClinicAppointment,
  declineClinicAppointment,
  proposeAppointmentTime,
  rescheduleClinicAppointment,
  fetchClinicStaff,
  getVaultClinicStaff,
} from "../../services/vault-clinic";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  LoaderCircle,
  Stethoscope,
  Filter,
} from "lucide-react";

interface AppointmentItem {
  id: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
    phone: string | null;
    email: string | null;
  };
  vaultClinicianId: string | null;
  vaultClinician: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  appointmentType: string;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  scheduledAt: string;
  scheduledEnd: string | null;
  durationMinutes: number | null;
  proposedTime: string | null;
  declineReason: string | null;
  reason: string | null;
  notes: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

export default function VaultClinicAppointmentsPage() {
  const currentStaff = getVaultClinicStaff();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [clinicians, setClinicians] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [activeTab, setActiveTab] = useState<"TRIAGE" | "CONFIRMED" | "ALL">("TRIAGE");
  const [selectedClinicianFilter, setSelectedClinicianFilter] = useState<string>("ALL");

  // Action Modals state
  const [actionTarget, setActionTarget] = useState<AppointmentItem | null>(null);
  const [modalType, setModalType] = useState<"CONFIRM" | "DECLINE" | "PROPOSE" | "RESCHEDULE" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for modals
  const [assignClinicianId, setAssignClinicianId] = useState<string>("");
  const [declineReason, setDeclineReason] = useState("");
  const [proposedDateTime, setProposedDateTime] = useState("");
  const [actionNotes, setActionNotes] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [apptsRes, staffRes] = await Promise.all([
        fetchClinicAppointments({
          vaultClinicianId: selectedClinicianFilter !== "ALL" ? selectedClinicianFilter : undefined,
        }),
        fetchClinicStaff().catch(() => []),
      ]);
      setAppointments(apptsRes || []);
      setClinicians(
        (staffRes || []).filter(
          (s: StaffMember) => s.role === "CLINICIAN" && s.isActive
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, [selectedClinicianFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openActionModal = (
    item: AppointmentItem,
    type: "CONFIRM" | "DECLINE" | "PROPOSE" | "RESCHEDULE"
  ) => {
    setActionTarget(item);
    setModalType(type);
    setAssignClinicianId(item.vaultClinicianId || (clinicians[0]?.id || ""));
    setDeclineReason("");
    setProposedDateTime("");
    setActionNotes("");
  };

  const closeModal = () => {
    setActionTarget(null);
    setModalType(null);
  };

  const handleConfirmSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionTarget) return;

    setIsSubmitting(true);
    try {
      await confirmClinicAppointment(actionTarget.id, {
        vaultClinicianId: assignClinicianId || undefined,
        notes: actionNotes || undefined,
      });
      setSuccess("Appointment confirmed and clinician assigned successfully.");
      setTimeout(() => setSuccess(null), 4000);
      closeModal();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionTarget) return;

    setIsSubmitting(true);
    try {
      await declineClinicAppointment(actionTarget.id, declineReason.trim() || "Slot unavailable");
      setSuccess("Appointment request declined.");
      setTimeout(() => setSuccess(null), 4000);
      closeModal();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProposeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionTarget || !proposedDateTime) return;

    setIsSubmitting(true);
    try {
      await proposeAppointmentTime(actionTarget.id, new Date(proposedDateTime).toISOString(), actionNotes);
      setSuccess("Alternative time proposal sent to patient.");
      setTimeout(() => setSuccess(null), 4000);
      closeModal();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to propose alternative time");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionTarget || !proposedDateTime) return;

    setIsSubmitting(true);
    try {
      await rescheduleClinicAppointment(actionTarget.id, new Date(proposedDateTime).toISOString(), actionNotes);
      setSuccess("Appointment rescheduled successfully.");
      setTimeout(() => setSuccess(null), 4000);
      closeModal();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list by tab
  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === "TRIAGE") {
      return appt.status === "SCHEDULED" || appt.proposedTime !== null;
    }
    if (activeTab === "CONFIRMED") {
      return appt.status === "CONFIRMED";
    }
    return true;
  });

  const triageCount = appointments.filter((a) => a.status === "SCHEDULED" || a.proposedTime !== null).length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;

  return (
    <VaultClinicShell
      pageTitle="Appointments & Queue"
      pageSubtitle="Review incoming visit requests, assign clinicians, and manage daily consultations"
      activeNavId="appointments"
    >
      <div className="space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Awaiting Triage</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{triageCount}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Confirmed Consultations</p>
                <p className="mt-1 text-2xl font-bold text-teal-600">{confirmedCount}</p>
              </div>
              <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Records</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{appointments.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>
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

        {/* Tab Controls & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("TRIAGE")}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "TRIAGE"
                  ? "bg-navy text-white font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              style={activeTab === "TRIAGE" ? { backgroundColor: "#003F66", color: "#ffffff" } : undefined}
            >
              Triage Queue ({triageCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CONFIRMED")}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "CONFIRMED"
                  ? "bg-navy text-white font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              style={activeTab === "CONFIRMED" ? { backgroundColor: "#003F66", color: "#ffffff" } : undefined}
            >
              Confirmed ({confirmedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "ALL"
                  ? "bg-navy text-white font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              style={activeTab === "ALL" ? { backgroundColor: "#003F66", color: "#ffffff" } : undefined}
            >
              All Records
            </button>
          </div>

          {currentStaff?.role !== "CLINICIAN" && clinicians.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedClinicianFilter}
                onChange={(e) => setSelectedClinicianFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
              >
                <option value="ALL">All Clinicians</option>
                {clinicians.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Appointments Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <LoaderCircle className="h-6 w-6 animate-spin text-teal-600" />
              <span className="ml-2 text-sm">Loading appointment records...</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No appointments found</p>
              <p className="text-xs mt-1 text-slate-400">
                {activeTab === "TRIAGE"
                  ? "All incoming appointment requests have been processed."
                  : "No visits scheduled under this filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Assigned Clinician</th>
                    <th className="px-4 py-3">Reason / Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => {
                    const scheduledDate = new Date(appt.scheduledAt);
                    const isTriage = appt.status === "SCHEDULED";

                    const badgeClass =
                      appt.status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : appt.status === "SCHEDULED"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : appt.status === "COMPLETED"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-600 border-slate-200";

                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {appt.patient.firstName} {appt.patient.lastName}
                            </p>
                            <p className="text-xs font-mono text-slate-400">{appt.patient.patientNumber}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {scheduledDate.toLocaleDateString()}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {" "}({appt.durationMinutes || 30} mins)
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {appt.vaultClinician ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-800">
                              <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                              {appt.vaultClinician.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-700 max-w-xs truncate">
                            {appt.reason || "General visit"}
                          </p>
                          {appt.proposedTime && (
                            <p className="text-[11px] text-amber-600 font-medium">
                              Proposed: {new Date(appt.proposedTime).toLocaleString()}
                            </p>
                          )}
                          {appt.declineReason && (
                            <p className="text-[11px] text-rose-600 truncate">
                              Declined: {appt.declineReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isTriage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openActionModal(appt, "CONFIRM")}
                                  className="h-7 px-2.5 rounded-lg bg-teal text-[11px] font-semibold text-white hover:bg-teal/90 transition-colors shadow-2xs"
                                  style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                                >
                                  <span style={{ color: "#ffffff" }}>Confirm</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openActionModal(appt, "PROPOSE")}
                                  className="h-7 px-2 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  Propose time
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openActionModal(appt, "DECLINE")}
                                  className="h-7 px-2 rounded-lg border border-rose-200 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {appt.status === "CONFIRMED" && (
                              <button
                                type="button"
                                onClick={() => openActionModal(appt, "RESCHEDULE")}
                                className="h-7 px-2.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Reschedule
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Confirm & Assign Clinician */}
        {modalType === "CONFIRM" && actionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Confirm Appointment</h3>
                <button type="button" onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmSubmit} className="mt-4 space-y-3.5">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
                  <p className="font-semibold text-slate-800">
                    Patient: {actionTarget.patient.firstName} {actionTarget.patient.lastName}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Requested Date: {new Date(actionTarget.scheduledAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assign Attending Clinician
                  </label>
                  <select
                    value={assignClinicianId}
                    onChange={(e) => setAssignClinicianId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">No clinician assigned yet</option>
                    {clinicians.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Internal Consultation Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Preparation notes or room assignment..."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-8 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-8 rounded-lg bg-teal px-4 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                  >
                    <span style={{ color: "#ffffff" }}>{isSubmitting ? "Confirming..." : "Confirm & Notify Patient"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Decline Request */}
        {modalType === "DECLINE" && actionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Decline Appointment Request</h3>
                <button type="button" onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleDeclineSubmit} className="mt-4 space-y-3.5">
                <p className="text-xs text-slate-600">
                  Please provide a reason for declining this request. This message will be sent to the patient.
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Decline Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="e.g. Doctor unavailable on this day, clinic fully booked..."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-8 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-8 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Declining..." : "Decline Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Propose Alternative Time */}
        {modalType === "PROPOSE" && actionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Propose Alternative Time</h3>
                <button type="button" onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleProposeSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Proposed Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={proposedDateTime}
                    onChange={(e) => setProposedDateTime(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Note to Patient (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Reason for alternative time..."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-8 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-8 rounded-lg bg-teal px-4 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                  >
                    <span style={{ color: "#ffffff" }}>{isSubmitting ? "Sending..." : "Send Proposal"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reschedule */}
        {modalType === "RESCHEDULE" && actionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Reschedule Consultation</h3>
                <button type="button" onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={proposedDateTime}
                    onChange={(e) => setProposedDateTime(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Reason / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Reason for rescheduling..."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-8 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-8 rounded-lg bg-teal px-4 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                  >
                    <span style={{ color: "#ffffff" }}>{isSubmitting ? "Rescheduling..." : "Save & Reschedule"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </VaultClinicShell>
  );
}

