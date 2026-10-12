import { useState, useEffect, useCallback } from "react";
import VaultClinicShell from "../../components/layout/VaultClinicShell";
import {
  fetchAccessGrants,
  revokeAccessGrant,
} from "../../services/vault-clinic";
import {
  SlidersHorizontal,
  Clock,
  Radio,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

interface GrantItem {
  id: string;
  source: string;
  sharedSections: string[];
  expiresAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
    phone: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export default function VaultClinicGrantsPage() {
  const [grants, setGrants] = useState<GrantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadGrants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAccessGrants();
      setGrants(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load active grants");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  const handleRevoke = async (grant: GrantItem) => {
    if (!window.confirm(`Are you sure you want to revoke vault access for ${grant.patient.firstName} ${grant.patient.lastName}?`)) {
      return;
    }

    try {
      await revokeAccessGrant(grant.id, "Revoked by clinician");
      setSuccess(`Access grant for ${grant.patient.firstName} ${grant.patient.lastName} revoked successfully.`);
      setTimeout(() => setSuccess(null), 4000);
      await loadGrants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke grant");
    }
  };

  const cardTapCount = grants.filter((g) => g.source === "CARD_TAP").length;
  const appointmentCount = grants.filter((g) => g.source === "APPOINTMENT").length;

  return (
    <VaultClinicShell
      pageTitle="Active Consent Grants"
      pageSubtitle="Monitor time-bound consent grants permitting access to patient health vault records"
      activeNavId="grants"
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Grants</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{grants.length}</p>
              </div>
              <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">NFC Card Tap Grants</p>
                <p className="mt-1 text-2xl font-bold text-teal-600">{cardTapCount}</p>
              </div>
              <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                <Radio className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Appointment Grants</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{appointmentCount}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <CalendarCheck className="h-5 w-5" />
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

        {/* Grants Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <LoaderCircle className="h-6 w-6 animate-spin text-teal-600" />
              <span className="ml-2 text-sm">Loading active consent grants...</span>
            </div>
          ) : grants.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No active consent grants</p>
              <p className="text-xs mt-1 text-slate-400">
                Grants are created when patients book consultations or when an in-person NFC card tap is confirmed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Authorization Source</th>
                    <th className="px-4 py-3">Shared Vault Sections</th>
                    <th className="px-4 py-3">Expires At</th>
                    <th className="px-4 py-3">Authorized By</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grants.map((grant) => {
                    const expiry = new Date(grant.expiresAt);
                    const hoursLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60)));

                    return (
                      <tr key={grant.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {grant.patient.firstName} {grant.patient.lastName}
                            </p>
                            <p className="text-xs font-mono text-slate-400">{grant.patient.patientNumber}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            {grant.source === "CARD_TAP" ? (
                              <>
                                <Radio className="h-3.5 w-3.5 text-teal-600" />
                                NFC Card Tap
                              </>
                            ) : (
                              <>
                                <CalendarCheck className="h-3.5 w-3.5 text-blue-600" />
                                Appointment Booking
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {grant.sharedSections && grant.sharedSections.length > 0 ? (
                              grant.sharedSections.map((sec) => (
                                <span
                                  key={sec}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {sec}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">All Sections</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-xs font-medium text-slate-800">{expiry.toLocaleString()}</p>
                            <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {hoursLeft} hour(s) remaining
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {grant.createdBy ? grant.createdBy.name : "Patient System"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRevoke(grant)}
                            className="h-7 px-2.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            Revoke Grant
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </VaultClinicShell>
  );
}

