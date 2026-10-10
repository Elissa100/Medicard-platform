import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { fetchAuditLogs, getAdminData } from "../../services/admin";
import {
  ScrollText,
  Search,
  Eye,
  X,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  email: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal for metadata inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const admin = getAdminData();

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs({ search, action: actionFilter });
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const renderActionBadge = (action: string) => {
    if (action.includes("FAILED")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {action}
        </span>
      );
    }
    if (action.includes("SUCCESS") || action.includes("CREATED") || action.includes("LINKED")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {action}
        </span>
      );
    }
    if (action.includes("EXPORT")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        {action}
      </span>
    );
  };

  return (
    <AppLayout
      currentRole="platform_admin"
      pageTitle="Security and operational audit log"
      pageSubtitle="Immutable record of administrative logins, status transitions, and data exports"
      activeNavId="audit"
      userDisplayName={admin.firstName ? `${admin.firstName} ${admin.lastName}` : "Platform Admin"}
      userEmail={admin.email || "admin@medcard.rw"}
      actionButton={{
        label: "Refresh",
        onClick: loadLogs,
        icon: <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />,
      }}
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadLogs} className="text-xs font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8D9B]" />
              <input
                type="text"
                placeholder="Search by email, action, or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-white border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] placeholder:text-[#7A8D9B]"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-3 rounded-lg text-xs font-semibold bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90 transition-colors"
            >
              Filter
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 px-3 rounded-lg text-xs font-medium border border-[#E4EBF0] bg-white text-[#475B6B] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
            >
              <option value="ALL">All action types</option>
              <option value="ADMIN_LOGIN_SUCCESS">Login success</option>
              <option value="ADMIN_LOGIN_FAILED">Login failed</option>
              <option value="ADMIN_PASSWORD_CHANGED">Password changed</option>
              <option value="CLINIC_STATUS_UPDATED">Clinic status updated</option>
              <option value="USER_STATUS_UPDATED">User status updated</option>
              <option value="CARD_STATUS_UPDATED">Card status updated</option>
              <option value="CARD_LINKED">Card linked</option>
              <option value="FINANCE_EXPORT_DOWNLOADED">Finance export</option>
            </select>
          </div>
        </div>

        {/* Logs Table Card */}
        <div className="bg-white border border-[#E4EBF0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F6F8FA] border-b border-[#E4EBF0] text-xs font-semibold text-[#7A8D9B]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action event</th>
                  <th className="py-3 px-4">Actor account</th>
                  <th className="py-3 px-4">IP address</th>
                  <th className="py-3 px-4">Client user agent</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBF0]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#7A8D9B]">
                      <LoaderCircle size={20} className="animate-spin mx-auto mb-2 text-[#00A3B8]" />
                      Loading security audit records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#7A8D9B]">
                      <ScrollText size={24} className="mx-auto mb-2 text-[#7A8D9B]" />
                      No audit records found matching your filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F6F8FA]/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-[#7A8D9B] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">{renderActionBadge(log.action)}</td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#0B1F3A]">
                        {log.email}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-[#475B6B]">
                        {log.ipAddress || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#7A8D9B] max-w-[200px] truncate">
                        {log.userAgent || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {log.metadata ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg border border-[#E4EBF0] hover:bg-[#F6F8FA] text-[#475B6B] hover:text-[#0B1F3A] transition-colors"
                            title="Inspect event metadata"
                          >
                            <Eye size={14} />
                          </button>
                        ) : (
                          <span className="text-xs text-[#7A8D9B]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metadata Inspection Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs">
            <div className="bg-white border border-[#E4EBF0] rounded-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-3">
                <div>
                  <h3 className="text-base font-semibold text-[#0B1F3A]">Event payload metadata</h3>
                  <span className="text-xs text-[#7A8D9B] font-mono">{selectedLog.action}</span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A] hover:bg-[#F6F8FA]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#F6F8FA] rounded-lg border border-[#E4EBF0] font-mono text-[#0B1F3A] overflow-x-auto max-h-60">
                  <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </div>
                <div className="pt-2 text-[11px] text-[#7A8D9B]">
                  Recorded on {new Date(selectedLog.createdAt).toUTCString()} from IP {selectedLog.ipAddress || "unknown"}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#E4EBF0]">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-[#475B6B] border border-[#E4EBF0] hover:bg-[#F6F8FA]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
