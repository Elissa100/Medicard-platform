import { Pill, FlaskConical } from "lucide-react";
import type { Prescription, LabResultItem } from "./types";
import { formatDate } from "./types";
import { PageHeader, Card, StatusBadge, EmptyState } from "./components/ui";

export interface VaultPrescriptionsTabProps {
  prescriptions: Prescription[];
  labResults: LabResultItem[];
}

function prescriptionVariant(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE" || s === "DISPENSED") return "green";
  if (s === "PENDING") return "amber";
  if (s === "CANCELLED" || s === "EXPIRED") return "gray";
  return "blue";
}

export default function VaultPrescriptionsTab({
  prescriptions,
  labResults,
}: VaultPrescriptionsTabProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Prescriptions and results"
        description="Medication courses and diagnostic reports released by authorized providers"
      />

      {/* Prescriptions */}
      <Card
        title="Active and previous prescriptions"
        subtitle={`${prescriptions.length} record${prescriptions.length !== 1 ? "s" : ""}`}
      >
        {prescriptions.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {prescriptions.map((p) => (
              <div key={p.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                  <span className="font-semibold text-[14px] text-[#0F2942]">
                    Dr. {p.prescribedBy.firstName} {p.prescribedBy.lastName}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} variant={prescriptionVariant(p.status)} />
                    <span className="text-[12px] text-[#7A8D9B]">
                      {formatDate(p.encounter?.startedAt || p.createdAt)}
                    </span>
                  </div>
                </div>
                {p.encounter?.facility?.name && (
                  <p className="text-[12px] text-[#7A8D9B]">{p.encounter.facility.name}</p>
                )}
                <div className="space-y-1.5 mt-1">
                  {p.items.map((item) => (
                    <div
                      key={item.id}
                      className="text-[13px] text-[#475B6B] pl-3 border-l-2 border-[#E4EBF0]"
                    >
                      <span className="font-semibold text-[#0F2942]">{item.medicationName}</span>
                      {item.dosage && <span className="text-[#7A8D9B]"> · {item.dosage}</span>}
                      {item.frequency && <span className="text-[#7A8D9B]"> · {item.frequency}</span>}
                      {item.instructions && (
                        <p className="text-[12px] text-[#7A8D9B] mt-0.5">{item.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Pill}
            title="No prescriptions on file"
            hint="Medication records from participating clinics appear here once authorized."
          />
        )}
      </Card>

      {/* Lab Results */}
      <Card
        title="Laboratory and diagnostic results"
        subtitle={`${labResults.length} result${labResults.length !== 1 ? "s" : ""} on file`}
      >
        {labResults.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {labResults.map((lab) => (
              <div key={lab.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                  <span className="font-semibold text-[14px] text-[#0F2942]">
                    {lab.encounter?.facility?.name || "Clinic Lab"}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={lab.status}
                      variant={lab.status === "COMPLETED" ? "green" : "amber"}
                    />
                    <span className="text-[12px] text-[#7A8D9B]">
                      {formatDate(lab.completedAt || lab.requestedAt)}
                    </span>
                  </div>
                </div>
                {lab.results.length > 0 ? (
                  <div className="space-y-1">
                    {lab.results.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-[13px] pl-3 border-l-2 border-[#E4EBF0] py-0.5"
                      >
                        <span className="text-[#475B6B]">{r.testName}</span>
                        <span className="font-semibold text-[#0F2942]">
                          {r.resultValue} {r.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#7A8D9B]">Results pending.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FlaskConical}
            title="No laboratory results"
            hint="Diagnostic reports released by authorized labs appear here."
          />
        )}
      </Card>
    </div>
  );
}

