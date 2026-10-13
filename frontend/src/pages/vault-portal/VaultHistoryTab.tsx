import { AlertTriangle, HeartPulse, Plus, X } from "lucide-react";
import type { VaultProfile } from "./types";
import { PageHeader, Card, EmptyState } from "./components/ui";

export interface VaultHistoryTabProps {
  selectedProfile: VaultProfile;
  isSaving: boolean;
  onOpenAllergyModal: () => void;
  onOpenConditionModal: () => void;
  onDeleteAllergy: (id: string) => Promise<void>;
  onDeleteCondition: (id: string) => Promise<void>;
}

export default function VaultHistoryTab({
  selectedProfile,
  isSaving,
  onOpenAllergyModal,
  onOpenConditionModal,
  onDeleteAllergy,
  onDeleteCondition,
}: VaultHistoryTabProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Medical history"
        description="Recorded allergies and diagnosed medical conditions"
      />

      {/* Allergies */}
      <Card
        title="Allergies and adverse reactions"
        subtitle="Recorded patient allergies shared with clinics on consent."
        action={
          <button
            type="button"
            onClick={onOpenAllergyModal}
            className="h-9 px-3.5 rounded-lg bg-white border border-[#E4EBF0] text-[13px] font-medium text-[#0F2942] hover:bg-[#F6F8FA] flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Add allergy</span>
          </button>
        }
      >
        {selectedProfile.allergies.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {selectedProfile.allergies.map((allergy) => (
              <div
                key={allergy.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-[14px] text-[#0F2942] block">
                    {allergy.allergen}
                  </span>
                  <span className="text-[12px] text-[#7A8D9B]">
                    Severity: {allergy.severity || "Not stated"}
                    {allergy.reaction ? ` · Reaction: ${allergy.reaction}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteAllergy(allergy.id)}
                  disabled={isSaving}
                  className="text-[#7A8D9B] hover:text-red-600 p-1 rounded transition-colors disabled:opacity-50"
                  aria-label="Remove allergy"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No allergies recorded"
            hint="Add known allergens so clinics can take appropriate precautions."
            action={
              <button
                type="button"
                onClick={onOpenAllergyModal}
                className="text-[13px] text-[#007C8C] hover:underline font-medium"
              >
                Add allergy
              </button>
            }
          />
        )}
      </Card>

      {/* Conditions */}
      <Card
        title="Medical conditions"
        subtitle="Active or previously diagnosed medical conditions."
        action={
          <button
            type="button"
            onClick={onOpenConditionModal}
            className="h-9 px-3.5 rounded-lg bg-white border border-[#E4EBF0] text-[13px] font-medium text-[#0F2942] hover:bg-[#F6F8FA] flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Add condition</span>
          </button>
        }
      >
        {selectedProfile.medicalConditions.length > 0 ? (
          <div className="divide-y divide-[#E4EBF0]">
            {selectedProfile.medicalConditions.map((cond) => (
              <div
                key={cond.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-[14px] text-[#0F2942] block">{cond.name}</span>
                  {cond.description && (
                    <span className="text-[12px] text-[#7A8D9B]">{cond.description}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteCondition(cond.id)}
                  disabled={isSaving}
                  className="text-[#7A8D9B] hover:text-red-600 p-1 rounded transition-colors disabled:opacity-50"
                  aria-label="Remove condition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={HeartPulse}
            title="No conditions recorded"
            hint="Add known diagnoses so your health records stay complete."
            action={
              <button
                type="button"
                onClick={onOpenConditionModal}
                className="text-[13px] text-[#007C8C] hover:underline font-medium"
              >
                Add condition
              </button>
            }
          />
        )}
      </Card>
    </div>
  );
}

