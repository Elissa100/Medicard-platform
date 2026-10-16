import { FileText, ShieldCheck } from "lucide-react";
import type { VaultProfile } from "./types";
import { formatDate } from "./types";
import { PageHeader, Card, StatusBadge, EmptyState } from "./components/ui";

export interface VaultDocumentsTabProps {
  selectedProfile: VaultProfile;
}

function insuranceVariant(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "green";
  if (s === "EXPIRED") return "gray";
  if (s === "PENDING") return "amber";
  return "blue";
}

export default function VaultDocumentsTab({ selectedProfile }: VaultDocumentsTabProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        description="Medical reports, referral letters, and linked insurance policies"
      />

      {/* Medical Documents */}
      <Card
        title="Medical documents"
        subtitle="Uploaded files such as reports, referral letters, and scans."
      >
        {selectedProfile.medicalDocuments.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {selectedProfile.medicalDocuments.map((doc) => (
              <div key={doc.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                <FileText size={16} className="text-[#7A8D9B] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-semibold text-[#0F2942] block truncate">
                    {doc.title}
                  </span>
                  <span className="text-[12px] text-[#7A8D9B]">
                    {doc.type} · {formatDate(doc.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No uploaded documents"
            hint="Medical reports and referral letters shared by clinics appear here."
          />
        )}
      </Card>

      {/* Insurance Policies */}
      <Card
        title="Insurance policies"
        subtitle="Linked health insurance memberships and coverage numbers."
      >
        {selectedProfile.patientInsurances.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {selectedProfile.patientInsurances.map((ins) => (
              <div key={ins.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <div className="min-w-0">
                    <span className="text-[14px] font-semibold text-[#0F2942] block">
                      {ins.plan.provider.name} — {ins.plan.name}
                    </span>
                    <span className="text-[12px] text-[#7A8D9B] font-mono">
                      Member ID: {ins.membershipNumber}
                    </span>
                  </div>
                  <StatusBadge status={ins.status} variant={insuranceVariant(ins.status)} className="self-start sm:self-auto shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No insurance policies linked"
            hint={`Current payment method: ${selectedProfile.insuranceProvider || "Direct payer"}.`}
          />
        )}
      </Card>
    </div>
  );
}

