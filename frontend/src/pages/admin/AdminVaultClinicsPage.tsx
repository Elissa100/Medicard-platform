import { useState, useEffect, useCallback, type FormEvent } from "react";
import AppLayout from "../../components/layout/AppLayout";
import {
  fetchVaultClinics,
  createVaultClinic,
  updateVaultClinicStatus,
  getAdminData,
} from "../../services/admin";
import {
  ShieldCheck,
  Search,
  Plus,
  X,
  LoaderCircle,
  Building2,
  Users,
  CalendarCheck,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  Mail,
  Clock,
} from "lucide-react";

interface VaultClinic {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  vaultStatus: "ACTIVE" | "SUSPENDED" | "INVITED";
  bookingMode: "MANUAL" | "AUTOMATIC";
  operatingHours: string | null;
  staffCount: number;
  servicesCount: number;
  appointmentsCount: number;
  createdAt: string;
}

export default function AdminVaultClinicsPage() {
  const [clinics, setClinics] = useState<VaultClinic[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "INVITED">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    bookingMode: "MANUAL" as "MANUAL" | "AUTOMATIC",
  });

  const loadClinics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchVaultClinics({
        search: search.trim() || undefined,
        status: statusFilter,
      });
      setClinics(response.clinics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vault clinics");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadClinics();
  }, [loadClinics]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadClinics();
  };

  const handleStatusChange = async (clinic: VaultClinic, targetStatus: "ACTIVE" | "SUSPENDED") => {
    const actionLabel = targetStatus === "ACTIVE" ? "reactivate" : "suspend";
    if (!window.confirm(`Are you sure you want to ${actionLabel} access for ${clinic.name}?`)) {
      return;
    }

    try {
      await updateVaultClinicStatus(clinic.id, targetStatus);
      setClinics((prev) =>
        prev.map((c) => (c.id === clinic.id ? { ...c, vaultStatus: targetStatus } : c))
      );
      setSuccessMessage(`Clinic ${clinic.name} is now ${targetStatus.toLowerCase()}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update clinic status");
    }
  };

  const handleCreateClinic = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    setError(null);

    try {
      await createVaultClinic(formData);
      setShowModal(false);
      setFormData({
        name: "",
        code: "",
        phone: "",
        email: "",
        address: "",
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        bookingMode: "MANUAL",
      });
      setSuccessMessage(
        "Vault clinic registered successfully! Temporary sign-in credentials have been emailed to the administrator."
      );
      setTimeout(() => setSuccessMessage(null), 6000);
      await loadClinics();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to register vault clinic";
      setModalError(msg);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = clinics.filter((c) => c.vaultStatus === "ACTIVE").length;
  const suspendedCount = clinics.filter((c) => c.vaultStatus === "SUSPENDED").length;
  const invitedCount = clinics.filter((c) => c.vaultStatus === "INVITED").length;

  const admin = getAdminData();

  return (
    <AppLayout
      currentRole="platform_admin"
      pageTitle="Patient vault clinics"
      pageSubtitle="Manage participating clinics and clinic administrator access"
      activeNavId="vault-clinics"
      userDisplayName={admin.firstName ? `${admin.firstName} ${admin.lastName}` : "Platform Admin"}
      userEmail={admin.email || "admin@medcard.rw"}
    >
      <div className="p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Vault Clinics</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{clinics.length}</p>
              </div>
              <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Invited / Setup</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{invitedCount}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Suspended</p>
                <p className="mt-1 text-2xl font-bold text-rose-600">{suspendedCount}</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <PowerOff className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by clinic name, code, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </form>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
              {(["ALL", "ACTIVE", "INVITED", "SUSPENDED"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === tab
                      ? "bg-navy text-white font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  style={statusFilter === tab ? { backgroundColor: "#003F66", color: "#ffffff" } : undefined}
                >
                  {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setShowModal(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-teal px-4 text-xs font-semibold text-white shadow-sm hover:bg-teal/90 transition-colors"
              style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
            >
              <Plus className="h-4 w-4" style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff" }}>Register Vault Clinic</span>
            </button>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <LoaderCircle className="h-6 w-6 animate-spin text-teal-600" />
              <span className="ml-2 text-sm">Loading participating clinics...</span>
            </div>
          ) : clinics.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <ShieldCheck className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-800">No vault clinics registered yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Register a clinic to provision their portal and invite their clinic administrator.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setModalError(null);
                    setShowModal(true);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal px-5 text-xs font-semibold text-white shadow-md hover:bg-teal/90 transition-colors"
                  style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                >
                  <Plus className="h-4 w-4" style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff" }}>Register Vault Clinic</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Clinic</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Vault Status</th>
                    <th className="px-4 py-3">Booking Mode</th>
                    <th className="px-4 py-3">Staff</th>
                    <th className="px-4 py-3">Services</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clinics.map((clinic) => {
                    const statusBadgeClass =
                      clinic.vaultStatus === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : clinic.vaultStatus === "INVITED"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200";

                    return (
                      <tr key={clinic.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900">{clinic.name}</p>
                            <p className="text-xs text-slate-400">{clinic.address || clinic.email || "No address"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                          {clinic.code}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass}`}>
                            {clinic.vaultStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                            <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
                            {clinic.bookingMode === "AUTOMATIC" ? "Instant Confirm" : "Manual Approval"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {clinic.staffCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {clinic.servicesCount} configured
                        </td>
                        <td className="px-4 py-3 text-right">
                          {clinic.vaultStatus === "ACTIVE" ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(clinic, "SUSPENDED")}
                              className="text-xs font-medium text-rose-600 hover:text-rose-800 transition-colors"
                            >
                              Suspend access
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(clinic, "ACTIVE")}
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
                            >
                              Reactivate
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

        {/* Register Clinic Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-lg my-auto max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-teal-50 p-2 text-teal-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Register Patient Vault Clinic</h3>
                    <p className="text-xs text-slate-500">Configure clinic profile and invite the clinic administrator</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form id="vault-clinic-form" onSubmit={handleCreateClinic} className="flex-1 overflow-y-auto p-5 space-y-4">
                {modalError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-relaxed">{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Clinic Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kigali Health Center"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Unique Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KHC-01"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 uppercase font-mono focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="+250 788 000 000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Clinic Email</label>
                    <input
                      type="email"
                      placeholder="contact@clinic.rw"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Address / District</label>
                  <input
                    type="text"
                    placeholder="KG 10 St, Gasabo, Kigali"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-800 mb-2">Clinic Administrator Details</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Admin Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Jean Pierre"
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Admin Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="admin@clinic.rw"
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Admin Phone</label>
                        <input
                          type="tel"
                          placeholder="+250 788 111 222"
                          value={formData.adminPhone}
                          onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Initial Booking Mode</label>
                  <select
                    value={formData.bookingMode}
                    onChange={(e) => setFormData({ ...formData, bookingMode: e.target.value as "MANUAL" | "AUTOMATIC" })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="MANUAL">Manual Review (Receptionist approves appointment requests)</option>
                    <option value="AUTOMATIC">Automatic Confirmation (Instant slot booking)</option>
                  </select>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-start gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
                  <span>
                    A secure temporary password will be generated automatically and dispatched to the administrator. They will be required to change it on their first login.
                  </span>
                </div>
              </form>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="vault-clinic-form"
                  disabled={isSubmitting}
                  className="h-9 inline-flex items-center justify-center rounded-lg bg-teal px-5 text-xs font-semibold text-white shadow-sm hover:bg-teal/90 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin mr-1.5" style={{ color: "#ffffff" }} />
                      <span style={{ color: "#ffffff" }}>Registering...</span>
                    </>
                  ) : (
                    <span style={{ color: "#ffffff" }}>Register and Send Invitation</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

