import { useState, useEffect, type FormEvent } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { fetchClinics, updateClinicStatus, createClinic, getAdminData } from "../../services/admin";
import {
  Building2,
  Search,
  Plus,
  X,
  LoaderCircle,
} from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  staffCount: number;
  appointmentCount: number;
  createdAt: string;
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClinic, setNewClinic] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
  });

  const admin = getAdminData();

  const loadClinics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchClinics();
      setClinics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClinics();
  }, []);

  const handleToggleStatus = async (clinic: Clinic) => {
    const nextStatus = clinic.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateClinicStatus(clinic.id, nextStatus);
      setClinics((prev) =>
        prev.map((c) => (c.id === clinic.id ? { ...c, status: nextStatus } : c))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update clinic status");
    }
  };

  const handleCreateClinic = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await createClinic(newClinic);
      setClinics((prev) => [created, ...prev]);
      setShowModal(false);
      setNewClinic({ name: "", code: "", phone: "", email: "", address: "" });
      loadClinics();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create clinic");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClinics = clinics.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout
      currentRole="platform_admin"
      pageTitle="Clinics and healthcare facilities"
      pageSubtitle="Partner hospitals, clinics, and medical centers"
      activeNavId="clinics"
      userDisplayName={admin.firstName ? `${admin.firstName} ${admin.lastName}` : "Platform Admin"}
      userEmail={admin.email || "admin@medcard.rw"}
      actionButton={{
        label: "Onboard clinic",
        onClick: () => setShowModal(true),
        icon: <Plus size={14} />,
      }}
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadClinics} className="text-xs font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8D9B]" />
            <input
              type="text"
              placeholder="Search by clinic name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-white border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] placeholder:text-[#7A8D9B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === "ALL"
                  ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                  : "bg-white text-[#475B6B] border-[#E4EBF0] hover:bg-[#F6F8FA]"
              }`}
            >
              All ({clinics.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === "ACTIVE"
                  ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                  : "bg-white text-[#475B6B] border-[#E4EBF0] hover:bg-[#F6F8FA]"
              }`}
            >
              Active ({clinics.filter((c) => c.status === "ACTIVE").length})
            </button>
            <button
              onClick={() => setStatusFilter("INACTIVE")}
              className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === "INACTIVE"
                  ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                  : "bg-white text-[#475B6B] border-[#E4EBF0] hover:bg-[#F6F8FA]"
              }`}
            >
              Inactive ({clinics.filter((c) => c.status === "INACTIVE").length})
            </button>
          </div>
        </div>

        {/* Clinics Table Card */}
        <div className="bg-white border border-[#E4EBF0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F6F8FA] border-b border-[#E4EBF0] text-xs font-semibold text-[#7A8D9B]">
                <tr>
                  <th className="py-3 px-4">Clinic name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Staff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBF0]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#7A8D9B]">
                      <LoaderCircle size={20} className="animate-spin mx-auto mb-2 text-[#00A3B8]" />
                      Loading clinics...
                    </td>
                  </tr>
                ) : filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#7A8D9B]">
                      <Building2 size={24} className="mx-auto mb-2 text-[#7A8D9B]" />
                      No clinics found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-[#F6F8FA]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#0B1F3A] block">{clinic.name}</span>
                        <span className="text-xs text-[#7A8D9B]">{clinic.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F6F8FA] border border-[#E4EBF0] text-[#0B1F3A]">
                          {clinic.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#475B6B]">{clinic.phone}</td>
                      <td className="py-3.5 px-4 text-xs text-[#475B6B]">{clinic.address}</td>
                      <td className="py-3.5 px-4 text-xs text-[#0B1F3A] font-medium">
                        {clinic.staffCount} staff
                      </td>
                      <td className="py-3.5 px-4">
                        {clinic.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(clinic)}
                          className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors ${
                            clinic.status === "ACTIVE"
                              ? "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
                              : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {clinic.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Onboard Clinic Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs">
            <div className="bg-white border border-[#E4EBF0] rounded-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-3">
                <h3 className="text-base font-semibold text-[#0B1F3A]">Onboard partner clinic</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A] hover:bg-[#F6F8FA]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateClinic} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                    Clinic name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kigali Central Polyclinic"
                    value={newClinic.name}
                    onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                    Facility code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KCP"
                    value={newClinic.code}
                    onChange={(e) => setNewClinic({ ...newClinic, code: e.target.value })}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                      Phone number
                    </label>
                    <input
                      type="text"
                      placeholder="+250 788 123 456"
                      value={newClinic.phone}
                      onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
                      className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="info@clinic.rw"
                      value={newClinic.email}
                      onChange={(e) => setNewClinic({ ...newClinic, email: e.target.value })}
                      className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                    Address / district
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gasabo, Kigali"
                    value={newClinic.address}
                    onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
                    className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4EBF0]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-9 px-4 rounded-lg text-xs font-semibold text-[#475B6B] border border-[#E4EBF0] hover:bg-[#F6F8FA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-[#00A3B8] hover:bg-[#008FA2] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting && <LoaderCircle size={14} className="animate-spin" />}
                    <span>Save clinic</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
