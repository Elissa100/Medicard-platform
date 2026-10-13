import { Calendar, ChevronRight, Clock, Stethoscope, Bell } from "lucide-react";
import type { DashboardData, PatientAppointment, Consultation, VaultProfile, TabId } from "./types";
import { formatDateTime, formatDate, isPlaceholderName } from "./types";
import { PageHeader, Card, StatStrip, DefinitionList, StatusBadge, EmptyState } from "./components/ui";

export interface VaultOverviewTabProps {
  dashboard: DashboardData;
  selectedProfile: VaultProfile;
  upcomingAppointments: PatientAppointment[];
  consultations: Consultation[];
  onNavigateTab: (tab: TabId) => void;
  onOpenBooking: () => void;
  onCancelAppointment: (id: string) => void;
  cancellingAppointmentId: string | null;
}

export default function VaultOverviewTab({
  dashboard,
  selectedProfile,
  upcomingAppointments,
  consultations,
  onNavigateTab,
  onOpenBooking,
  onCancelAppointment,
  cancellingAppointmentId,
}: VaultOverviewTabProps) {
  const isPremium = dashboard.subscription?.plan === "PREMIUM";
  const hasPlaceholderName = isPlaceholderName(
    selectedProfile.firstName,
    selectedProfile.lastName,
    selectedProfile.email
  );

  const nextAppointment = upcomingAppointments[0];

  const statItems = [
    {
      label: "Vault plan",
      value: isPremium ? "Premium" : "Basic",
      subtext: isPremium ? "Family health records active" : "Standard patient vault",
    },
    {
      label: "MedCard patient ID",
      value: selectedProfile.patientNumber,
      subtext: "Encrypted patient vault",
    },
    {
      label: "Allergies and conditions",
      value: selectedProfile.allergies.length + selectedProfile.medicalConditions.length,
      subtext: `${selectedProfile.allergies.length} allergies, ${selectedProfile.medicalConditions.length} conditions`,
    },
    {
      label: "Appointments",
      value: upcomingAppointments.length,
      subtext: upcomingAppointments.length > 0 ? "Upcoming visit scheduled" : "No visits queued",
    },
  ];

  const emergencyContactValue =
    selectedProfile.emergencyContactName && selectedProfile.emergencyContactPhone ? (
      `${selectedProfile.emergencyContactName} (${selectedProfile.emergencyContactPhone})`
    ) : selectedProfile.emergencyContactName ? (
      selectedProfile.emergencyContactName
    ) : (
      <button
        type="button"
        onClick={() => onNavigateTab("profile")}
        className="text-[#007C8C] hover:underline font-medium text-[13px]"
      >
        Add emergency contact
      </button>
    );

  const emergencyItems = [
    {
      label: "Emergency contact",
      value: emergencyContactValue,
    },
    {
      label: "Known allergies",
      value:
        selectedProfile.allergies.length > 0
          ? selectedProfile.allergies.map((a) => a.allergen).join(", ")
          : "None reported",
    },
    {
      label: "Insurance provider",
      value: selectedProfile.insuranceProvider || "Direct payer",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Overview"
        description="Patient Vault summary and active medical records"
        action={
          <button
            type="button"
            onClick={onOpenBooking}
            className="h-9 px-3.5 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            Book an appointment
          </button>
        }
      />

      {/* Summary Stat Strip */}
      <StatStrip stats={statItems} />

      {/* Next Appointment (Main Card) */}
      <Card
        title="Next appointment"
        action={
          <button
            type="button"
            onClick={() => onNavigateTab("appointments")}
            className="text-[13px] text-[#007C8C] hover:underline font-medium inline-flex items-center gap-0.5"
          >
            <span>View all ({upcomingAppointments.length})</span>
            <ChevronRight size={14} />
          </button>
        }
      >
        {nextAppointment ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] font-semibold text-[#0F2942]">
                  {nextAppointment.facility.name}
                </h3>
                <StatusBadge
                  status={nextAppointment.status === "CONFIRMED" ? "Confirmed" : "Pending confirmation"}
                  variant={nextAppointment.status === "CONFIRMED" ? "green" : "amber"}
                />
              </div>
              <p className="text-[13px] text-[#475B6B] flex items-center gap-1.5">
                <Clock size={14} className="text-[#7A8D9B]" />
                <span>{formatDateTime(nextAppointment.scheduledAt)}</span>
                <span className="text-[#7A8D9B]">· {nextAppointment.appointmentType}</span>
              </p>
              {nextAppointment.reason && (
                <p className="text-[12px] text-[#7A8D9B]">Reason: {nextAppointment.reason}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab("appointments")}
                className="h-9 px-3.5 rounded-lg bg-white border border-[#E4EBF0] text-[13px] font-medium text-[#0F2942] hover:bg-[#F6F8FA] transition-colors"
              >
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => onCancelAppointment(nextAppointment.id)}
                disabled={cancellingAppointmentId === nextAppointment.id}
                className="h-9 px-3.5 rounded-lg border border-red-200 text-[13px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {cancellingAppointmentId === nextAppointment.id ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No upcoming appointments"
            hint="Book a consultation with a participating clinic."
            action={
              <button
                type="button"
                onClick={onOpenBooking}
                className="text-[13px] text-[#007C8C] hover:underline font-medium"
              >
                Book an appointment
              </button>
            }
          />
        )}
      </Card>

      {/* Emergency Information */}
      <Card
        title="Emergency information"
        subtitle="Clinics see this information only when you share it."
        action={
          <button
            type="button"
            onClick={() => onNavigateTab("profile")}
            className="text-[13px] text-[#007C8C] hover:underline font-medium"
          >
            Edit
          </button>
        }
      >
        <div className="space-y-3">
          <div className="text-[14px] font-medium text-[#0F2942]">
            {hasPlaceholderName ? (
              <button
                type="button"
                onClick={() => onNavigateTab("profile")}
                className="text-[#007C8C] hover:underline"
              >
                Add your name
              </button>
            ) : (
              `${selectedProfile.firstName} ${selectedProfile.lastName}`
            )}
          </div>
          <DefinitionList items={emergencyItems} columns={3} />
        </div>
      </Card>

      {/* Side-by-side: Recent Consultations & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Consultations */}
        <Card
          title="Recent consultations"
          action={
            <button
              type="button"
              onClick={() => onNavigateTab("consultations")}
              className="text-[13px] text-[#007C8C] hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </button>
          }
        >
          {consultations.length > 0 ? (
            <div className="divide-y divide-[#E4EBF0]">
              {consultations.slice(0, 2).map((c) => (
                <div key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-[#0F2942]">{c.facility.name}</span>
                    <span className="text-[#7A8D9B] text-[12px]">{formatDate(c.startedAt)}</span>
                  </div>
                  <p className="text-[12px] text-[#475B6B] mt-0.5">
                    Dr. {c.provider.firstName} {c.provider.lastName} · {c.type}
                  </p>
                  {c.diagnoses.length > 0 && (
                    <p className="text-[12px] text-[#7A8D9B] mt-0.5">
                      Diagnosis: {c.diagnoses[0].description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="No recorded consultations"
              hint="Consultations from participating MedCard clinics appear here."
            />
          )}
        </Card>

        {/* Notifications */}
        <Card
          title="Notifications and reminders"
          action={
            <button
              type="button"
              onClick={() => onNavigateTab("notifications")}
              className="text-[13px] text-[#007C8C] hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </button>
          }
        >
          {upcomingAppointments.length > 0 ? (
            <div className="divide-y divide-[#E4EBF0]">
              <div className="py-2.5 first:pt-0 last:pb-0 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#0F2942]">Appointment reminder</span>
                  <StatusBadge status="Upcoming" variant="blue" />
                </div>
                <p className="text-[12px] text-[#475B6B]">
                  Scheduled visit at {upcomingAppointments[0].facility.name} on{" "}
                  {formatDateTime(upcomingAppointments[0].scheduledAt)}.
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="No unread notifications"
              hint="Reminders and health record updates appear here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

