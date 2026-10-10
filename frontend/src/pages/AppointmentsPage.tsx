import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ArrowRight,
  Wifi,
  X,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import {
  getAppointments,
  createAppointment,
  confirmAppointmentRequest,
  declineAppointmentRequest,
  proposeAppointmentTime,
  rescheduleAppointment,
  updateAppointmentStatus,
  getClinicSettings,
  updateClinicSettings,
  type ClinicAppointment,
} from "../services/api";

type ViewMode = "today" | "requests" | "calendar" | "settings";

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ViewMode>("today");
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Modals state
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<ClinicAppointment | null>(null);

  // Form states
  const [patientIdInput, setPatientIdInput] = useState("");
  const [appointmentTypeInput, setAppointmentTypeInput] = useState("CONSULTATION");
  const [scheduleDateTimeInput, setScheduleDateTimeInput] = useState("");
  const [durationInput, setDurationInput] = useState(30);
  const [reasonInput, setReasonInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Decline/Propose form
  const [declineReasonInput, setDeclineReasonInput] = useState("");
  const [proposedDateTimeInput, setProposedDateTimeInput] = useState("");

  // Clinic settings
  const [bookingMode, setBookingMode] = useState("MANUAL");
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; active: boolean }>>({
    monday: { open: "08:00", close: "17:00", active: true },
    tuesday: { open: "08:00", close: "17:00", active: true },
    wednesday: { open: "08:00", close: "17:00", active: true },
    thursday: { open: "08:00", close: "17:00", active: true },
    friday: { open: "08:00", close: "17:00", active: true },
    saturday: { open: "09:00", close: "13:00", active: true },
    sunday: { open: "00:00", close: "00:00", active: false },
  });

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      let data: ClinicAppointment[] = [];
      if (activeTab === "today") {
        data = await getAppointments({ date: selectedDate });
      } else if (activeTab === "requests") {
        data = await getAppointments({ status: "PENDING" });
      } else if (activeTab === "calendar") {
        data = await getAppointments({ date: selectedDate });
      }
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await getClinicSettings();
      if (res) {
        setBookingMode(res.bookingMode || "MANUAL");
        if (res.operatingHours) setOperatingHours(res.operatingHours);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "settings") {
      loadSettings();
    } else {
      loadAppointments();
    }
  }, [activeTab, selectedDate]);

  const handleCreateAppointment = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createAppointment({
        patientId: patientIdInput,
        appointmentType: appointmentTypeInput,
        scheduledAt: scheduleDateTimeInput,
        durationMinutes: durationInput,
        reason: reasonInput,
        notes: notesInput,
      });
      setBookModalOpen(false);
      setPatientIdInput("");
      setReasonInput("");
      setNotesInput("");
      loadAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (appt: ClinicAppointment) => {
    try {
      await confirmAppointmentRequest(appt.id);
      loadAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to confirm request");
    }
  };

  const handleDeclineSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      await declineAppointmentRequest(selectedAppt.id, { declineReason: declineReasonInput });
      setDeclineModalOpen(false);
      setDeclineReasonInput("");
      setSelectedAppt(null);
      loadAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to decline request");
    }
  };

  const handleProposeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      await proposeAppointmentTime(selectedAppt.id, {
        proposedTime: proposedDateTimeInput,
        notes: notesInput,
      });
      setProposeModalOpen(false);
      setProposedDateTimeInput("");
      setNotesInput("");
      setSelectedAppt(null);
      loadAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to propose time");
    }
  };

  const handleRescheduleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      await rescheduleAppointment(selectedAppt.id, {
        scheduledAt: scheduleDateTimeInput,
        durationMinutes: durationInput,
        notes: notesInput,
      });
      setRescheduleModalOpen(false);
      setSelectedAppt(null);
      loadAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reschedule");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(id, { status: newStatus });
      loadAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateClinicSettings({ bookingMode, operatingHours });
      alert("Clinic operating hours and booking mode saved successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const q = searchQuery.toLowerCase();
    const patientName = `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.toLowerCase();
    const patientNum = (apt.patient?.patientNumber || "").toLowerCase();
    const reason = (apt.reason || "").toLowerCase();
    return patientName.includes(q) || patientNum.includes(q) || reason.includes(q);
  });

  return (
    <AppLayout
      pageTitle="Clinic appointment workspace"
      pageSubtitle="Reception triage, provider calendar, patient flow, and operating rules"
      actionButton={{
        label: "Book appointment",
        onClick: () => {
          setScheduleDateTimeInput(new Date().toISOString().slice(0, 16));
          setBookModalOpen(true);
        },
        icon: <Plus size={16} />,
      }}
    >
      <div className="p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#E4EBF0] pb-4">
          <div className="flex items-center gap-1 bg-[#F6F8FA] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "today"
                  ? "bg-white text-teal shadow-sm"
                  : "text-[#7A8D9B] hover:text-[#0B1F3A]"
              }`}
            >
              Today's appointments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "requests"
                  ? "bg-white text-teal shadow-sm"
                  : "text-[#7A8D9B] hover:text-[#0B1F3A]"
              }`}
            >
              Requests triage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "calendar"
                  ? "bg-white text-teal shadow-sm"
                  : "text-[#7A8D9B] hover:text-[#0B1F3A]"
              }`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "settings"
                  ? "bg-white text-teal shadow-sm"
                  : "text-[#7A8D9B] hover:text-[#0B1F3A]"
              }`}
            >
              Operating hours & mode
            </button>
          </div>

          {activeTab !== "settings" && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8D9B]" />
                <input
                  type="text"
                  placeholder="Search patient, number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 pr-3 text-xs bg-white border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal w-48 sm:w-64"
                />
              </div>

              {activeTab !== "requests" && (
                <div className="flex items-center gap-1.5 bg-white border border-[#E4EBF0] rounded-lg px-2.5 h-9 text-xs">
                  <Calendar size={13} className="text-teal" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="focus:outline-none text-[#0B1F3A] font-medium"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: Today's Appointments & Queue */}
        {activeTab === "today" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
                <span className="text-xs text-[#7A8D9B] block mb-1">Total scheduled</span>
                <span className="text-2xl font-semibold text-[#0B1F3A]">{appointments.length}</span>
              </div>
              <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
                <span className="text-xs text-[#7A8D9B] block mb-1">Waiting in lobby</span>
                <span className="text-2xl font-semibold text-amber-600">
                  {appointments.filter((a) => a.status === "CHECKED_IN").length}
                </span>
              </div>
              <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
                <span className="text-xs text-[#7A8D9B] block mb-1">Confirmed / Ready</span>
                <span className="text-2xl font-semibold text-teal">
                  {appointments.filter((a) => a.status === "CONFIRMED" || a.status === "SCHEDULED").length}
                </span>
              </div>
              <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
                <span className="text-xs text-[#7A8D9B] block mb-1">Completed today</span>
                <span className="text-2xl font-semibold text-emerald-600">
                  {appointments.filter((a) => a.status === "COMPLETED").length}
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#E4EBF0] rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F6F8FA] border-b border-[#E4EBF0] text-xs font-semibold text-[#7A8D9B]">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Type & Reason</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EBF0]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#7A8D9B]">
                        <LoaderCircle size={20} className="animate-spin mx-auto mb-2 text-teal" />
                        Loading appointments...
                      </td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#7A8D9B]">
                        <CalendarDays size={24} className="mx-auto mb-2 text-[#7A8D9B]" />
                        No appointments found for {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-[#F6F8FA]/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-[#0B1F3A] font-semibold whitespace-nowrap">
                          {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#0B1F3A] block">
                            {appt.patient?.firstName} {appt.patient?.lastName}
                          </span>
                          <span className="text-xs text-[#7A8D9B]">{appt.patient?.patientNumber}</span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="font-medium text-[#0B1F3A] block">{appt.appointmentType}</span>
                          <span className="text-[#7A8D9B]">{appt.reason || "General consultation"}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#475B6B]">
                          {appt.provider ? `Dr. ${appt.provider.firstName} ${appt.provider.lastName}` : "Queue assigned"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appt.status === "CONFIRMED"
                                ? "bg-teal/10 text-teal"
                                : appt.status === "CHECKED_IN"
                                ? "bg-amber-50 text-amber-700"
                                : appt.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {appt.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {appt.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleStatusChange(appt.id, "CHECKED_IN")}
                                className="h-7 px-2.5 rounded-md text-xs font-semibold bg-teal text-white hover:bg-teal-hover transition-colors shadow-sm"
                              >
                                Check in
                              </button>
                            )}
                            {appt.status === "CHECKED_IN" && (
                              <button
                                onClick={() => handleStatusChange(appt.id, "COMPLETED")}
                                className="h-7 px-2.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedAppt(appt);
                                setScheduleDateTimeInput(new Date(appt.scheduledAt).toISOString().slice(0, 16));
                                setRescheduleModalOpen(true);
                              }}
                              className="h-7 px-2 rounded-md text-xs font-medium border border-[#E4EBF0] text-[#475B6B] hover:bg-slate-50"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleStatusChange(appt.id, "NO_SHOW")}
                              className="h-7 px-2 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50"
                            >
                              No-show
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Requests Triage (Pending Vault bookings) */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E4EBF0] rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F6F8FA] border-b border-[#E4EBF0] text-xs font-semibold text-[#7A8D9B]">
                  <tr>
                    <th className="py-3 px-4">Requested date & time</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Type & Notes</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Triage actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EBF0]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-[#7A8D9B]">
                        <LoaderCircle size={20} className="animate-spin mx-auto mb-2 text-teal" />
                        Loading requests...
                      </td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-[#7A8D9B]">
                        <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-600" />
                        No pending appointment requests. All requests triaged!
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-[#F6F8FA]/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-[#0B1F3A] font-semibold whitespace-nowrap">
                          {new Date(appt.scheduledAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#0B1F3A] block">
                            {appt.patient?.firstName} {appt.patient?.lastName}
                          </span>
                          <span className="text-xs text-[#7A8D9B]">{appt.patient?.phone || appt.patient?.patientNumber}</span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="font-medium text-[#0B1F3A] block">{appt.appointmentType}</span>
                          <span className="text-[#7A8D9B]">{appt.reason || "Patient Vault request"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700">
                            Pending approval
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleConfirm(appt)}
                              className="h-7 px-3 rounded-md text-xs font-semibold bg-teal text-white hover:bg-teal-hover transition-colors shadow-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppt(appt);
                                setProposedDateTimeInput(new Date(appt.scheduledAt).toISOString().slice(0, 16));
                                setProposeModalOpen(true);
                              }}
                              className="h-7 px-2.5 rounded-md text-xs font-medium border border-[#E4EBF0] text-[#475B6B] hover:bg-slate-50"
                            >
                              Propose new time
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppt(appt);
                                setDeclineModalOpen(true);
                              }}
                              className="h-7 px-2.5 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200"
                            >
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Calendar View */}
        {activeTab === "calendar" && (
          <div className="bg-white border border-[#E4EBF0] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4EBF0]">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-teal" />
                <h3 className="font-semibold text-[#0B1F3A] text-sm">
                  Daily schedule timeline: {selectedDate}
                </h3>
              </div>
              <span className="text-xs text-[#7A8D9B]">
                {filteredAppointments.length} slot(s) scheduled
              </span>
            </div>

            <div className="divide-y divide-[#E4EBF0]">
              {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((slot) => {
                const apptsInSlot = filteredAppointments.filter((a) => {
                  const hour = new Date(a.scheduledAt).getHours();
                  return hour === parseInt(slot.split(":")[0], 10);
                });

                return (
                  <div key={slot} className="py-3 flex items-start gap-4">
                    <span className="font-mono text-xs font-semibold text-[#7A8D9B] w-14 shrink-0 pt-1">
                      {slot}
                    </span>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {apptsInSlot.length === 0 ? (
                        <div className="text-xs text-[#7A8D9B]/50 italic pt-1">Open window</div>
                      ) : (
                        apptsInSlot.map((appt) => (
                          <div
                            key={appt.id}
                            className="p-2.5 rounded-lg border border-teal/20 bg-teal/5 text-xs text-[#0B1F3A] flex items-center justify-between gap-3 min-w-[240px]"
                          >
                            <div>
                              <span className="font-semibold block">
                                {appt.patient?.firstName} {appt.patient?.lastName}
                              </span>
                              <span className="text-[#7A8D9B]">{appt.appointmentType}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-teal/30 text-teal">
                              {appt.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Clinic Admin Settings */}
        {activeTab === "settings" && (
          <div className="bg-white border border-[#E4EBF0] rounded-xl p-6 space-y-6 max-w-3xl">
            <div>
              <h3 className="font-semibold text-[#0B1F3A] text-base mb-1">Booking mode & availability</h3>
              <p className="text-xs text-[#7A8D9B]">
                Control how appointments requested through Patient Vault are confirmed
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#0B1F3A]">Online booking mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setBookingMode("MANUAL")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    bookingMode === "MANUAL"
                      ? "border-teal bg-teal/5 ring-1 ring-teal"
                      : "border-[#E4EBF0] hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold text-sm text-[#0B1F3A] block mb-1">
                    Manual triage (Receptionist confirms)
                  </span>
                  <p className="text-xs text-[#7A8D9B]">
                    Requests appear in the triage queue and must be accepted or declined before confirmation.
                  </p>
                </div>

                <div
                  onClick={() => setBookingMode("AUTOMATIC")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    bookingMode === "AUTOMATIC"
                      ? "border-teal bg-teal/5 ring-1 ring-teal"
                      : "border-[#E4EBF0] hover:bg-slate-50"
                  }`}
                >
                  <span className="font-semibold text-sm text-[#0B1F3A] block mb-1">
                    Automatic booking (Instant confirmation)
                  </span>
                  <p className="text-xs text-[#7A8D9B]">
                    Appointments are confirmed immediately if a provider has an open time window.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E4EBF0]">
              <h4 className="text-xs font-semibold text-[#0B1F3A]">Weekly operating hours</h4>
              <div className="space-y-2">
                {Object.entries(operatingHours).map(([day, schedule]) => (
                  <div key={day} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E4EBF0]/60">
                    <span className="font-medium text-[#0B1F3A] capitalize w-28">{day}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.open}
                        onChange={(e) =>
                          setOperatingHours({
                            ...operatingHours,
                            [day]: { ...schedule, open: e.target.value },
                          })
                        }
                        className="border border-[#E4EBF0] rounded px-2 py-1 text-xs"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={schedule.close}
                        onChange={(e) =>
                          setOperatingHours({
                            ...operatingHours,
                            [day]: { ...schedule, close: e.target.value },
                          })
                        }
                        className="border border-[#E4EBF0] rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="h-9 px-5 rounded-lg text-xs font-semibold bg-teal text-white hover:bg-teal-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal"
              >
                Save operating configuration
              </button>
            </div>
          </div>
        )}

        {/* Modal: Book Appointment */}
        {bookModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0B1F3A]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E4EBF0] shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4EBF0]">
                <h3 className="font-semibold text-[#0B1F3A] text-sm">Schedule clinical encounter</h3>
                <button
                  onClick={() => setBookModalOpen(false)}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Patient UUID *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter registered patient ID"
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Appointment type</label>
                  <select
                    value={appointmentTypeInput}
                    onChange={(e) => setAppointmentTypeInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                  >
                    <option value="CONSULTATION">General Consultation</option>
                    <option value="FOLLOW_UP">Follow-up Visit</option>
                    <option value="LABORATORY">Lab Diagnostic</option>
                    <option value="DENTAL">Dental Checkup</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Scheduled date & time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleDateTimeInput}
                    onChange={(e) => setScheduleDateTimeInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={durationInput}
                    onChange={(e) => setDurationInput(parseInt(e.target.value, 10))}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Reason for visit</label>
                  <input
                    type="text"
                    placeholder="e.g. Headache, Routine checkup"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E4EBF0]">
                  <button
                    type="button"
                    onClick={() => setBookModalOpen(false)}
                    className="h-8 px-3 rounded-lg border border-[#E4EBF0] text-[#475B6B] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-8 px-4 rounded-lg bg-teal text-white hover:bg-teal-hover shadow-sm font-semibold disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Confirm booking"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reschedule */}
        {rescheduleModalOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 bg-[#0B1F3A]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E4EBF0] shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4EBF0]">
                <h3 className="font-semibold text-[#0B1F3A] text-sm">Reschedule appointment</h3>
                <button
                  onClick={() => setRescheduleModalOpen(false)}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">New date & time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleDateTimeInput}
                    onChange={(e) => setScheduleDateTimeInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Reschedule note</label>
                  <input
                    type="text"
                    placeholder="e.g. Patient called to delay slot"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E4EBF0]">
                  <button
                    type="button"
                    onClick={() => setRescheduleModalOpen(false)}
                    className="h-8 px-3 rounded-lg border border-[#E4EBF0] text-[#475B6B] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-lg bg-teal text-white hover:bg-teal-hover shadow-sm font-semibold"
                  >
                    Save new schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Decline Request */}
        {declineModalOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 bg-[#0B1F3A]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E4EBF0] shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4EBF0]">
                <h3 className="font-semibold text-rose-700 text-sm">Decline appointment request</h3>
                <button
                  onClick={() => setDeclineModalOpen(false)}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDeclineSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Reason for declining *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Practitioner unavailable on that day. Please select alternate date."
                    value={declineReasonInput}
                    onChange={(e) => setDeclineReasonInput(e.target.value)}
                    className="w-full p-2.5 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E4EBF0]">
                  <button
                    type="button"
                    onClick={() => setDeclineModalOpen(false)}
                    className="h-8 px-3 rounded-lg border border-[#E4EBF0] text-[#475B6B] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm font-semibold"
                  >
                    Confirm decline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Propose New Time */}
        {proposeModalOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 bg-[#0B1F3A]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#E4EBF0] shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4EBF0]">
                <h3 className="font-semibold text-teal text-sm">Propose alternate time to patient</h3>
                <button
                  onClick={() => setProposeModalOpen(false)}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleProposeSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Proposed date & time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={proposedDateTimeInput}
                    onChange={(e) => setProposedDateTimeInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">Message to patient</label>
                  <input
                    type="text"
                    placeholder="e.g. Doctor is in surgery in morning; proposing afternoon slot."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E4EBF0]">
                  <button
                    type="button"
                    onClick={() => setProposeModalOpen(false)}
                    className="h-8 px-3 rounded-lg border border-[#E4EBF0] text-[#475B6B] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-lg bg-teal text-white hover:bg-teal-hover shadow-sm font-semibold"
                  >
                    Send proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
