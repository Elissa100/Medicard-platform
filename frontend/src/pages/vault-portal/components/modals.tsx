import { useState, type FormEvent } from "react";
import { X, LoaderCircle } from "lucide-react";
import type { ParticipatingClinic } from "../types";

export interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: ParticipatingClinic[];
  initialClinicId?: string;
  isSubmitting: boolean;
  onSubmit: (facilityId: string, service: string, date: string, time: string, reason: string, notes: string) => Promise<void>;
}

export function BookAppointmentModal({
  isOpen,
  onClose,
  clinics,
  initialClinicId = "",
  isSubmitting,
  onSubmit,
}: BookAppointmentModalProps) {
  const [facilityId, setFacilityId] = useState(initialClinicId || (clinics[0]?.id || ""));
  const [service, setService] = useState("General Consultation");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(facilityId, service, date, time, reason, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl border border-[#E4EBF0] max-w-lg w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-3">
          <h3 className="text-[15px] font-semibold text-[#0F2942]">Book an appointment</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7A8D9B] hover:text-[#0F2942] p-1 rounded"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Participating clinic</label>
            <select
              required
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            >
              <option value="">Select clinic</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.address || "Kigali"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Service requested</label>
            <input
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-[#475B6B] block">Date</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#475B6B] block">Time</label>
              <input
                required
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Reason for visit</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Follow-up consultation or annual checkup"
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring recent test results"
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>

          <div className="pt-2.5 flex justify-end gap-2 border-t border-[#E4EBF0]">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg border border-[#E4EBF0] text-[13px] font-medium text-[#475B6B] hover:bg-[#F6F8FA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <LoaderCircle size={14} className="animate-spin text-white" />}
              <span>Submit request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface AddAllergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  onSubmit: (allergen: string, reaction: string) => Promise<void>;
}

export function AddAllergyModal({ isOpen, onClose, isSaving, onSubmit }: AddAllergyModalProps) {
  const [allergen, setAllergen] = useState("");
  const [reaction, setReaction] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!allergen.trim()) return;
    await onSubmit(allergen.trim(), reaction.trim());
    setAllergen("");
    setReaction("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl border border-[#E4EBF0] max-w-sm w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-2.5">
          <h3 className="text-[15px] font-semibold text-[#0F2942]">Add allergy record</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7A8D9B] hover:text-[#0F2942] p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Allergen</label>
            <input
              required
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts"
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Reaction (optional)</label>
            <input
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="e.g. Skin rash, swelling"
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-[#E4EBF0]">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg border border-[#E4EBF0] text-[13px] font-medium text-[#475B6B] hover:bg-[#F6F8FA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving..." : "Save allergy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface AddConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  onSubmit: (name: string, description: string) => Promise<void>;
}

export function AddConditionModal({ isOpen, onClose, isSaving, onSubmit }: AddConditionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit(name.trim(), description.trim());
    setName("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl border border-[#E4EBF0] max-w-sm w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-2.5">
          <h3 className="text-[15px] font-semibold text-[#0F2942]">Add medical condition</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7A8D9B] hover:text-[#0F2942] p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Condition name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asthma, Hypertension"
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Notes (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Diagnosed in 2021"
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-[#E4EBF0]">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg border border-[#E4EBF0] text-[13px] font-medium text-[#475B6B] hover:bg-[#F6F8FA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving..." : "Save condition"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface AddDependentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  onSubmit: (dependent: { firstName: string; lastName: string }) => Promise<void>;
}

export function AddDependentModal({ isOpen, onClose, isSaving, onSubmit }: AddDependentModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    await onSubmit({ firstName: firstName.trim(), lastName: lastName.trim() });
    setFirstName("");
    setLastName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl border border-[#E4EBF0] max-w-sm w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-2.5">
          <h3 className="text-[15px] font-semibold text-[#0F2942]">Add family profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7A8D9B] hover:text-[#0F2942] p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">First name</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#475B6B] block">Last name</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-9 text-[13px] bg-white rounded-lg border border-[#E4EBF0] px-3 text-[#0F2942] mt-1 focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-[#E4EBF0]">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg border border-[#E4EBF0] text-[13px] font-medium text-[#475B6B] hover:bg-[#F6F8FA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white text-[13px] font-semibold disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Creating..." : "Create profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

