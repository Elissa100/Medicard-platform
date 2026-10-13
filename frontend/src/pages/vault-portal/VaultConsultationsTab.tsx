import { Stethoscope } from "lucide-react";
import type { Consultation } from "./types";
import { formatDate } from "./types";
import { PageHeader, Card, StatusBadge, EmptyState } from "./components/ui";

export interface VaultConsultationsTabProps {
  consultations: Consultation[];
}

function consultationVariant(status: string) {
  if (status === "COMPLETED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  return "gray";
}

export default function VaultConsultationsTab({ consultations }: VaultConsultationsTabProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Consultations"
        description="Clinical encounters released by participating MedCard healthcare providers"
      />

      <Card
        title="Consultation history"
        subtitle={`${consultations.length} record${consultations.length !== 1 ? "s" : ""} on file`}
      >
        {consultations.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {consultations.map((c) => (
              <div key={c.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-[14px] text-[#0F2942]">
                      {c.facility.name}
                    </span>
                    <StatusBadge
                      status={c.status}
                      variant={consultationVariant(c.status)}
                    />
                  </div>
                  <span className="text-[12px] text-[#7A8D9B]">{formatDate(c.startedAt)}</span>
                </div>
                <p className="text-[13px] text-[#475B6B]">
                  Clinician: Dr. {c.provider.firstName} {c.provider.lastName} · {c.type}
                </p>
                {c.diagnoses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.diagnoses.map((d) => (
                      <span
                        key={d.id}
                        className="text-[12px] px-2 py-0.5 rounded bg-[#F6F8FA] border border-[#E4EBF0] text-[#475B6B] font-medium"
                      >
                        {d.description}
                      </span>
                    ))}
                  </div>
                )}
                {c.clinicalNotes.length > 0 && c.clinicalNotes[0].assessment && (
                  <p className="text-[12px] text-[#7A8D9B] italic">
                    Assessment: {c.clinicalNotes[0].assessment}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Stethoscope}
            title="No consultation records"
            hint="Encounter records from participating clinics appear here once released."
          />
        )}
      </Card>
    </div>
  );
}

