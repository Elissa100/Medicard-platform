import { useState, useEffect, type FormEvent } from "react";
import VaultClinicShell from "../../components/layout/VaultClinicShell";
import {
  fetchClinicSettings,
  updateClinicSettings,
  fetchClinicServices,
  createClinicService,
  toggleClinicService,
} from "../../services/vault-clinic";
import {
  Clock,
  Layers,
  Plus,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  code: string | null;
  durationMinutes: number;
  price: number | null;
  currency: string;
  isActive: boolean;
}

export default function VaultClinicSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings state
  const [bookingMode, setBookingMode] = useState<"MANUAL" | "AUTOMATIC">("MANUAL");
  const [operatingHours, setOperatingHours] = useState("");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);

  // Services state
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState<number | "">("");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingsRes, servicesRes] = await Promise.all([
        fetchClinicSettings(),
        fetchClinicServices(),
      ]);
      if (settingsRes.settings) {
        setBookingMode(settingsRes.settings.bookingMode || "MANUAL");
        setOperatingHours(settingsRes.settings.operatingHours || "Mon - Fri: 08:00 AM - 05:00 PM");
        setSlotDurationMinutes(settingsRes.settings.slotDurationMinutes || 30);
      }
      setServices(servicesRes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinic configuration");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await updateClinicSettings({
        bookingMode,
        operatingHours,
        slotDurationMinutes,
      });
      setSuccess("Clinic settings saved successfully.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddService = async (e: FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      const created = await createClinicService({
        name: newServiceName.trim(),
        durationMinutes: newServiceDuration,
        price: newServicePrice === "" ? undefined : Number(newServicePrice),
      });
      setServices((prev) => [...prev, created]);
      setShowServiceModal(false);
      setNewServiceName("");
      setNewServiceDuration(30);
      setNewServicePrice("");
      setSuccess("New service successfully added to catalog.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add service");
    }
  };

  const handleToggleService = async (service: ServiceItem) => {
    const nextState = !service.isActive;
    try {
      await toggleClinicService(service.id, nextState);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: nextState } : s))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service status");
    }
  };

  // Checklist verification
  const hasHours = Boolean(operatingHours && operatingHours.trim().length > 3);
  const hasActiveService = services.some((s) => s.isActive);

  return (
    <VaultClinicShell
      pageTitle="Clinic Setup & Operating Settings"
      pageSubtitle="Configure your operating hours, appointment booking policy, and clinical services"
      activeNavId="settings"
    >
      <div className="max-w-4xl space-y-6">
        {/* Setup Progress Checklist */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clinic Onboarding Checklist
            </h3>
            <span className="text-xs font-medium text-slate-500">
              {[hasHours, hasActiveService, true].filter(Boolean).length} / 3 Completed
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${hasHours ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${hasHours ? "text-emerald-600" : "text-slate-300"}`} />
              <div>
                <p className="text-xs font-semibold text-slate-800">Operating Hours</p>
                <p className="text-[11px] text-slate-500">{hasHours ? "Configured" : "Needs setup"}</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${hasActiveService ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${hasActiveService ? "text-emerald-600" : "text-slate-300"}`} />
              <div>
                <p className="text-xs font-semibold text-slate-800">Service Catalog</p>
                <p className="text-[11px] text-slate-500">{hasActiveService ? `${services.filter(s => s.isActive).length} active` : "Add services"}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Booking Mode</p>
                <p className="text-[11px] text-slate-500">{bookingMode === "AUTOMATIC" ? "Instant Confirm" : "Manual Review"}</p>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <LoaderCircle className="h-6 w-6 animate-spin text-teal-600" />
            <span className="ml-2 text-sm">Loading clinic settings...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* General Settings Form */}
            <form onSubmit={handleSaveSettings} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Operating Schedule & Booking Rules</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Operating Hours Schedule
                  </label>
                  <input
                    type="text"
                    required
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="e.g. Mon - Fri: 08:00 AM - 05:00 PM, Sat: 09:00 - 13:00"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Visible to patients when searching for clinics in the MedCard directory.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Default Consultation Duration
                  </label>
                  <select
                    value={slotDurationMinutes}
                    onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes (Standard)</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Appointment Booking Approval Policy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingMode("MANUAL")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      bookingMode === "MANUAL"
                        ? "border-teal bg-pale-cyan/50 text-navy ring-2 ring-teal shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-navy">Manual Receptionist Review</span>
                      {bookingMode === "MANUAL" && <Check className="h-4 w-4 text-teal" />}
                    </div>
                    <p className="text-[11px] text-body-text">
                      Patient appointment requests require acceptance or rescheduling by clinic staff.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingMode("AUTOMATIC")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      bookingMode === "AUTOMATIC"
                        ? "border-teal bg-pale-cyan/50 text-navy ring-2 ring-teal shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-navy">Automatic Confirmation</span>
                      {bookingMode === "AUTOMATIC" && <Check className="h-4 w-4 text-teal" />}
                    </div>
                    <p className="text-[11px] text-body-text">
                      Available slots are immediately confirmed upon booking by registered vault patients.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 inline-flex items-center justify-center rounded-xl bg-teal px-5 text-xs font-semibold text-white shadow-sm hover:bg-teal/90 focus:outline-none focus:ring-2 focus:ring-teal disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin mr-1.5" style={{ color: "#ffffff" }} />
                      <span style={{ color: "#ffffff" }}>Saving changes...</span>
                    </>
                  ) : (
                    <span style={{ color: "#ffffff" }}>Save Schedule & Rules</span>
                  )}
                </button>
              </div>
            </form>

            {/* Service Catalog Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal" />
                  <h2 className="text-sm font-bold text-slate-900">Clinical Services Catalog</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowServiceModal(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal px-3 text-xs font-semibold text-white shadow-sm hover:bg-teal/90 transition-colors"
                  style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                >
                  <Plus className="h-3.5 w-3.5" style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff" }}>Add Service</span>
                </button>
              </div>

              {services.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Layers className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                  <p className="text-xs">No services configured yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-900">{service.name}</p>
                          <span
                            className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                              service.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                          >
                            {service.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {service.durationMinutes} mins
                          {service.price !== null && ` • ${service.price.toLocaleString()} ${service.currency}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleService(service)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                          service.isActive
                            ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {service.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Service Modal */}
        {showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Add Clinical Service</h3>
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddService} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dental Checkup"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Price (RWF)</label>
                    <input
                      type="number"
                      placeholder="Optional"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowServiceModal(false)}
                    className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 rounded-lg bg-teal px-4 text-xs font-semibold text-white shadow-sm hover:bg-teal/90 transition-colors"
                    style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
                  >
                    <span style={{ color: "#ffffff" }}>Add Service</span>
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

