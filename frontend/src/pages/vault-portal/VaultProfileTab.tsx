import type { FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import type { EditableProfile, VaultProfile } from "./types";
import { PageHeader, Card } from "./components/ui";

export interface VaultProfileTabProps {
  selectedProfile: VaultProfile;
  profileForm: EditableProfile;
  isSaving: boolean;
  onFormChange: (updates: Partial<EditableProfile>) => void;
  onSave: (e: FormEvent) => Promise<void>;
}

const INPUT_CLASS =
  "w-full h-9 text-[14px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]";
const LABEL_CLASS = "text-[13px] font-medium text-[#475B6B] block";

export default function VaultProfileTab({
  selectedProfile,
  profileForm,
  isSaving,
  onFormChange,
  onSave,
}: VaultProfileTabProps) {
  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader
        title="Profile"
        description="Personal and emergency contact details for this health record"
      />

      <form onSubmit={onSave}>
        <Card
          title="Personal details"
          subtitle="Your name, date of birth, and identification information."
          action={
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
            >
              {isSaving && <LoaderCircle size={14} className="animate-spin text-white" />}
              <span>Save changes</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={LABEL_CLASS}>First name</label>
              <input
                required
                value={profileForm.firstName}
                onChange={(e) => onFormChange({ firstName: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Last name</label>
              <input
                required
                value={profileForm.lastName}
                onChange={(e) => onFormChange({ lastName: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Date of birth</label>
              <input
                type="date"
                value={profileForm.dateOfBirth}
                onChange={(e) => onFormChange({ dateOfBirth: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Gender</label>
              <select
                value={profileForm.gender}
                onChange={(e) => onFormChange({ gender: e.target.value })}
                className={INPUT_CLASS}
              >
                <option value="UNKNOWN">Not specified</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Phone number</label>
              <input
                value={profileForm.phone}
                onChange={(e) => onFormChange({ phone: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>National ID / Passport</label>
              <input
                value={profileForm.nationalId}
                onChange={(e) => onFormChange({ nationalId: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E4EBF0]">
            <h3 className="text-[15px] font-semibold text-[#0F2942] mb-1">Emergency contact</h3>
            <p className="text-[13px] text-[#7A8D9B] mb-3">
              Clinics see this information only when you share it.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={LABEL_CLASS}>Contact name</label>
                <input
                  value={profileForm.emergencyContactName}
                  onChange={(e) => onFormChange({ emergencyContactName: e.target.value })}
                  placeholder="e.g. Jean Uwase"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Contact phone</label>
                <input
                  value={profileForm.emergencyContactPhone}
                  onChange={(e) => onFormChange({ emergencyContactPhone: e.target.value })}
                  placeholder="e.g. +250 788 000 000"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E4EBF0]">
            <h3 className="text-[15px] font-semibold text-[#0F2942] mb-3">Read-only information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={LABEL_CLASS}>Patient number</label>
                <div className="h-9 flex items-center px-3 mt-1 rounded-lg border border-[#E4EBF0] bg-[#F6F8FA] text-[14px] font-mono text-[#475B6B]">
                  {selectedProfile.patientNumber}
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Account email</label>
                <div className="h-9 flex items-center px-3 mt-1 rounded-lg border border-[#E4EBF0] bg-[#F6F8FA] text-[14px] text-[#475B6B] truncate">
                  {selectedProfile.email || "Not on file"}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}

