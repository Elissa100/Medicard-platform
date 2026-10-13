import { UsersRound, Plus } from "lucide-react";
import type { DashboardData } from "./types";
import { PageHeader, Card, StatusBadge, EmptyState } from "./components/ui";

export interface VaultFamilyTabProps {
  dashboard: DashboardData;
  selectedProfileId: string;
  onSelectProfileId: (id: string) => void;
  onOpenDependentModal: () => void;
}

export default function VaultFamilyTab({
  dashboard,
  selectedProfileId,
  onSelectProfileId,
  onOpenDependentModal,
}: VaultFamilyTabProps) {
  const allProfiles = [
    { ...dashboard.patient, isDependent: false },
    ...(dashboard.patient.dependents?.map((d) => ({ ...d, isDependent: true })) ?? []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Family profiles"
        description="Manage health records for your dependents"
        action={
          <button
            type="button"
            onClick={onOpenDependentModal}
            className="h-9 px-3.5 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Add dependent</span>
          </button>
        }
      />

      <Card
        title="All profiles"
        subtitle="Click a profile to view their health records throughout the vault."
      >
        {allProfiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allProfiles.map((profile) => {
              const isActive = selectedProfileId === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onSelectProfileId(profile.id)}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    isActive
                      ? "bg-[#EEF5FA] border-[#003F66]"
                      : "bg-white border-[#E4EBF0] hover:bg-[#F6F8FA]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[14px] text-[#0F2942] truncate">
                      {profile.firstName} {profile.lastName}
                    </span>
                    <StatusBadge
                      status={profile.isDependent ? "Dependent" : "Primary"}
                      variant={profile.isDependent ? "amber" : "blue"}
                    />
                  </div>
                  <p className="text-[12px] text-[#7A8D9B] font-mono mt-1 truncate">
                    {profile.patientNumber}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="No family profiles"
            hint="Add a dependent to manage their health records here."
            action={
              <button
                type="button"
                onClick={onOpenDependentModal}
                className="text-[13px] text-[#007C8C] hover:underline font-medium"
              >
                Add dependent
              </button>
            }
          />
        )}
      </Card>
    </div>
  );
}

