import { useState, useEffect, type FormEvent } from "react";
import VaultClinicShell from "../../components/layout/VaultClinicShell";
import {
  fetchClinicStaff,
  inviteClinicStaff,
  toggleClinicStaff,
  getVaultClinicStaff,
} from "../../services/vault-clinic";
import {
  Users,
  Plus,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CLINIC_ADMIN" | "RECEPTIONIST" | "CLINICIAN";
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function VaultClinicStaffPage() {
  const currentStaff = getVaultClinicStaff();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CLINICIAN" as "CLINICIAN" | "RECEPTIONIST",
  });

  const loadStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchClinicStaff();
      setStaffList(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleInviteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await inviteClinicStaff(formData);
      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "CLINICIAN",
      });
      setSuccess("Staff member invited successfully! Temporary credentials have been dispatched to their email.");
      setTimeout(() => setSuccess(null), 5000);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    if (staff.id === currentStaff?.id) {
      alert("You cannot disable your own active account.");
      return;
    }

    const nextState = !staff.isActive;
    const actionLabel = nextState ? "reactivate" : "disable";
    if (!window.confirm(`Are you sure you want to ${actionLabel} account for ${staff.name}?`)) {
      return;
    }

    try {
      await toggleClinicStaff(staff.id, nextState);
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, isActive: nextState } : s))
      );
      setSuccess(`Account for ${staff.name} has been ${nextState ? "activated" : "disabled"}.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update staff status");
    }
  };

  const cliniciansCount = staffList.filter((s) => s.role === "CLINICIAN").length;
  const receptionistsCount = staffList.filter((s) => s.role === "RECEPTIONIST").length;

  return (
    <VaultClinicShell
      pageTitle="Staff Management"
      pageSubtitle="Invite clinicians and receptionists to access the clinic workspace"
      activeNavId="staff"
      actionButton={{
        label: "Invite Staff",
        onClick: () => setShowModal(true),
        icon: <Plus className="h-4 w-4" />,
      }}
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Staff</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{staffList.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Clinicians (Vault Access)</p>
                <p className="mt-1 text-2xl font-bold text-teal-600">{cliniciansCount}</p>
              </div>
              <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                <Stethoscope className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Receptionists</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{receptionistsCount}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Staff Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <LoaderCircle className="h-6 w-6 animate-spin text-teal-600" />
              <span className="ml-2 text-sm">Loading staff members...</span>
            </div>
          ) : staffList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No staff members registered yet</p>
              <p className="text-xs mt-1 text-slate-400">Invite clinicians and receptionists to give them access.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Access Scope</th>
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3">Last Sign In</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((member) => {
                    const isSelf = member.id === currentStaff?.id;
                    const roleBadgeClass =
                      member.role === "CLINIC_ADMIN"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : member.role === "CLINICIAN"
                        ? "bg-teal-50 text-teal-700 border-teal-200"
                        : "bg-blue-50 text-blue-700 border-blue-200";

                    const roleLabel =
                      member.role === "CLINIC_ADMIN"
                        ? "Clinic Admin"
                        : member.role === "CLINICIAN"
                        ? "Clinician"
                        : "Receptionist";

                    const scopeLabel =
                      member.role === "CLINIC_ADMIN"
                        ? "Staff, Hours & Settings (No clinical data)"
                        : member.role === "CLINICIAN"
                        ? "Appointments & Patient Vault Records"
                        : "Appointments & Basic Patient Info";

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {member.name}
                              {isSelf && (
                                <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{member.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadgeClass}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {scopeLabel}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              member.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {member.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {member.lastLoginAt
                            ? new Date(member.lastLoginAt).toLocaleDateString()
                            : member.mustChangePassword
                            ? "Pending first login"
                            : "Never"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(member)}
                              className={`text-xs font-medium transition-colors ${
                                member.isActive
                                  ? "text-rose-600 hover:text-rose-800"
                                  : "text-emerald-600 hover:text-emerald-800"
                              }`}
                            >
                              {member.isActive ? "Disable" : "Reactivate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invite Staff Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Invite Clinic Staff Member</h3>
                    <p className="text-xs text-slate-500">Provision credentials for a clinician or receptionist</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Aline Mukamana"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="aline@clinic.rw"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+250 788 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role & Permissions *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "CLINICIAN" | "RECEPTIONIST" })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="CLINICIAN">Clinician / Doctor (Access to Patient Vault with Consent)</option>
                    <option value="RECEPTIONIST">Receptionist (Appointments & Basic Patient Info Only)</option>
                  </select>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 flex items-start gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <span>
                    A cryptographically secure temporary password will be dispatched to this email. They will be required to change it on their first login.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Inviting...
                      </>
                    ) : (
                      "Send Invitation"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </VaultClinicShell>
  );
}

