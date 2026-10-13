import { Bell, Calendar, CheckCircle2 } from "lucide-react";
import type { PatientAppointment } from "./types";
import { formatDateTime } from "./types";
import { PageHeader, Card, StatusBadge, EmptyState } from "./components/ui";

export interface VaultNotificationsTabProps {
  upcomingAppointments: PatientAppointment[];
}

export default function VaultNotificationsTab({ upcomingAppointments }: VaultNotificationsTabProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description="Appointment confirmations, reminders, and record update alerts"
      />

      <Card title="Recent activity">
        <div className="divide-y divide-[#E4EBF0]">
          {/* Account status — always shown */}
          <div className="py-3 first:pt-0 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-[14px] font-semibold text-[#0F2942] block">Account active</span>
              <p className="text-[13px] text-[#475B6B] mt-0.5">
                Your Patient Vault account is configured and linked to your MedCard.
              </p>
              <StatusBadge status="Live" variant="green" className="mt-1.5" />
            </div>
          </div>

          {/* Appointment reminder — if scheduled */}
          {upcomingAppointments.length > 0 ? (
            <div className="py-3 flex items-start gap-3">
              <Calendar size={16} className="text-[#7A8D9B] mt-0.5 shrink-0" />
              <div>
                <span className="text-[14px] font-semibold text-[#0F2942] block">
                  Appointment reminder
                </span>
                <p className="text-[13px] text-[#475B6B] mt-0.5">
                  Scheduled visit at {upcomingAppointments[0].facility.name} on{" "}
                  {formatDateTime(upcomingAppointments[0].scheduledAt)}.
                </p>
                <StatusBadge status="Upcoming" variant="blue" className="mt-1.5" />
              </div>
            </div>
          ) : (
            <div className="py-3">
              <EmptyState
                icon={Bell}
                title="No unread notifications"
                hint="Reminders and new record alerts appear here."
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

