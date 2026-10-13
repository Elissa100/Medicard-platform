import { useState, useMemo } from "react";
import { Calendar, Clock, MapPin, Plus, Search } from "lucide-react";
import type { PatientAppointment, ParticipatingClinic } from "./types";
import { formatDateTime } from "./types";
import { PageHeader, Card, StatusBadge, EmptyState } from "./components/ui";

export interface VaultAppointmentsTabProps {
  upcomingAppointments: PatientAppointment[];
  pastAppointments: PatientAppointment[];
  clinics: ParticipatingClinic[];
  onOpenBookingModal: (facilityId?: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  cancellingAppointmentId: string | null;
}

export default function VaultAppointmentsTab({
  upcomingAppointments,
  pastAppointments,
  clinics,
  onOpenBookingModal,
  onCancelAppointment,
  cancellingAppointmentId,
}: VaultAppointmentsTabProps) {
  const [subTab, setSubTab] = useState<"upcoming" | "past" | "find">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClinics = useMemo(() => {
    if (!searchQuery.trim()) return clinics;
    const q = searchQuery.toLowerCase();
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        c.services.some((s) => s.toLowerCase().includes(q))
    );
  }, [clinics, searchQuery]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Appointments"
        description="Schedule consultations and manage upcoming clinic visits"
        action={
          <button
            type="button"
            onClick={() => onOpenBookingModal()}
            className="h-9 px-3.5 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus size={15} />
            <span>Book an appointment</span>
          </button>
        }
      />

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E4EBF0] pb-3">
        <button
          type="button"
          onClick={() => setSubTab("upcoming")}
          className={`h-9 px-3.5 rounded-lg text-[13px] font-medium transition-colors ${
            subTab === "upcoming"
              ? "bg-[#003F66] text-white font-semibold"
              : "bg-white border border-[#E4EBF0] text-[#475B6B] hover:bg-[#F6F8FA]"
          }`}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab("past")}
          className={`h-9 px-3.5 rounded-lg text-[13px] font-medium transition-colors ${
            subTab === "past"
              ? "bg-[#003F66] text-white font-semibold"
              : "bg-white border border-[#E4EBF0] text-[#475B6B] hover:bg-[#F6F8FA]"
          }`}
        >
          Past visits ({pastAppointments.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab("find")}
          className={`h-9 px-3.5 rounded-lg text-[13px] font-medium transition-colors ${
            subTab === "find"
              ? "bg-[#003F66] text-white font-semibold"
              : "bg-white border border-[#E4EBF0] text-[#475B6B] hover:bg-[#F6F8FA]"
          }`}
        >
          Find a clinic ({clinics.length})
        </button>
      </div>

      {/* Subtab: Upcoming */}
      {subTab === "upcoming" && (
        <div className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appt) => (
              <Card key={appt.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-semibold text-[15px] text-[#0F2942]">
                        {appt.facility.name}
                      </h3>
                      <StatusBadge
                        status={appt.status === "CONFIRMED" ? "Confirmed" : "Pending confirmation"}
                        variant={appt.status === "CONFIRMED" ? "green" : "amber"}
                      />
                    </div>
                    <p className="text-[13px] text-[#475B6B] flex items-center gap-1.5">
                      <Clock size={14} className="text-[#7A8D9B]" />
                      <span>{formatDateTime(appt.scheduledAt)}</span>
                      <span className="text-[#7A8D9B]">· {appt.appointmentType}</span>
                    </p>
                    {appt.reason && (
                      <p className="text-[12px] text-[#7A8D9B]">Reason: {appt.reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onCancelAppointment(appt.id)}
                      disabled={cancellingAppointmentId === appt.id}
                      className="h-9 px-3.5 rounded-lg border border-red-200 text-[13px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {cancellingAppointmentId === appt.id ? "Cancelling..." : "Cancel booking"}
                    </button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <EmptyState
                icon={Calendar}
                title="No upcoming appointments"
                hint="Browse participating clinics to schedule a consultation."
                action={
                  <button
                    type="button"
                    onClick={() => setSubTab("find")}
                    className="text-[13px] text-[#007C8C] hover:underline font-medium"
                  >
                    Browse clinic directory
                  </button>
                }
              />
            </Card>
          )}
        </div>
      )}

      {/* Subtab: Past */}
      {subTab === "past" && (
        <div className="space-y-3">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appt) => (
              <Card key={appt.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-semibold text-[15px] text-[#0F2942]">
                        {appt.facility.name}
                      </h3>
                      <StatusBadge
                        status={appt.status}
                        variant={appt.status === "COMPLETED" ? "blue" : "gray"}
                      />
                    </div>
                    <p className="text-[12px] text-[#7A8D9B] mt-1">
                      {formatDateTime(appt.scheduledAt)} · {appt.appointmentType}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <EmptyState
                icon={Calendar}
                title="No past appointments"
                hint="Your appointment history will appear here once visits conclude."
              />
            </Card>
          )}
        </div>
      )}

      {/* Subtab: Find Clinic */}
      {subTab === "find" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-[#7A8D9B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinics by name, district, or service..."
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] pl-9 pr-3 text-[#0F2942] placeholder-[#7A8D9B] focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClinics.map((clinic) => (
              <Card key={clinic.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[15px] text-[#0F2942]">{clinic.name}</h3>
                    <StatusBadge status="Active clinic" variant="green" />
                  </div>
                  <p className="text-[12px] text-[#7A8D9B] flex items-center gap-1 mt-1">
                    <MapPin size={13} className="shrink-0 text-[#7A8D9B]" />
                    <span>{clinic.address || "Kigali, Rwanda"}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {clinic.services.map((svc) => (
                      <span
                        key={svc}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#F6F8FA] text-[#475B6B] border border-[#E4EBF0]"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E4EBF0] flex items-center justify-between">
                  <span className="text-[12px] text-[#7A8D9B]">{clinic.operatingHours}</span>
                  <button
                    type="button"
                    onClick={() => onOpenBookingModal(clinic.id)}
                    className="h-9 px-3.5 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold transition-colors"
                  >
                    Book appointment
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

