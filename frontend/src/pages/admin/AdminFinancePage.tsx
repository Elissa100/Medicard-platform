import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import {
  fetchFinanceOverview,
  fetchFinanceTransactions,
  fetchFinanceTransactionDetail,
  downloadFinanceExport,
  withdrawPlatformFunds,
  getAdminData,
} from "../../services/admin";
import {
  Search,
  Download,
  Eye,
  X,
  LoaderCircle,
  CreditCard,
  Smartphone,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

interface FinanceOverview {
  totals: {
    allTime: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    currency: string;
  };
  byPlan: {
    Basic: number;
    Premium: number;
  };
  byMethod: {
    MOBILE_MONEY: number;
    CARD: number;
    OTHER: number;
  };
  successfulCount: number;
  totalAttemptCount: number;
}

interface TransactionItem {
  id: string;
  customerReference: string;
  gatewayReference: string;
  plan: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  maskedPhone: string;
  status: string;
  patientName: string;
  patientNumber: string;
  createdAt: string;
}

interface TransactionDetail extends TransactionItem {
  updatedAt: string;
}

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  // Modal
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);

  // Withdrawal modal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTelco, setWithdrawTelco] = useState<"MTN" | "AIRTEL">("MTN");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const admin = getAdminData();

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(true);
    setWithdrawSuccess(null);
    try {
      const res = await withdrawPlatformFunds({
        amount: Number(withdrawAmount),
        telco: withdrawTelco,
        phone: withdrawPhone,
        reason: withdrawReason || "Platform revenue withdrawal",
      });
      setWithdrawSuccess(`Payout initiated successfully! Ref: ${res.reference}. Funds arriving to ${res.phone} (${res.telco}) shortly.`);
      setWithdrawAmount("");
      setWithdrawPhone("");
      setWithdrawReason("");
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ovData, txData] = await Promise.all([
        fetchFinanceOverview(),
        fetchFinanceTransactions({
          search,
          status: statusFilter,
          plan: planFilter,
          paymentMethod: methodFilter,
        }),
      ]);
      setOverview(ovData);
      setTransactions(txData.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load financial records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, planFilter, methodFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadFinanceExport({
        search,
        status: statusFilter,
        plan: planFilter,
        paymentMethod: methodFilter,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await fetchFinanceTransactionDetail(id);
      setSelectedTx(detail);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load details");
    }
  };

  const formatRwf = (val: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "COMPLETED" || s === "SUCCESS" || s === "SUCCESSFUL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Completed
        </span>
      );
    }
    if (s === "FAILED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {status}
      </span>
    );
  };

  return (
    <AppLayout
      currentRole="platform_admin"
      pageTitle="Finance and revenue operations"
      pageSubtitle="Subscription revenue, transaction audit, and masked payment ledger"
      activeNavId="finance"
      userDisplayName={admin.firstName ? `${admin.firstName} ${admin.lastName}` : "Platform Admin"}
      userEmail={admin.email || "admin@medcard.rw"}
      actionButton={{
        label: isExporting ? "Exporting..." : "Export CSV",
        onClick: handleExport,
        icon: isExporting ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />,
      }}
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadData} className="text-xs font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {/* Period Revenue Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
            <span className="text-[13px] text-[#7A8D9B] block mb-1">Today's collections</span>
            <div className="text-2xl font-semibold text-[#0B1F3A]">
              {isLoading ? "—" : formatRwf(overview?.totals.today ?? 0)}
            </div>
            <span className="text-xs text-[#7A8D9B] mt-1 block">Current day GMT+2</span>
          </div>

          <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
            <span className="text-[13px] text-[#7A8D9B] block mb-1">This week</span>
            <div className="text-2xl font-semibold text-[#0B1F3A]">
              {isLoading ? "—" : formatRwf(overview?.totals.thisWeek ?? 0)}
            </div>
            <span className="text-xs text-[#7A8D9B] mt-1 block">Week to date</span>
          </div>

          <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
            <span className="text-[13px] text-[#7A8D9B] block mb-1">This month</span>
            <div className="text-2xl font-semibold text-[#0B1F3A]">
              {isLoading ? "—" : formatRwf(overview?.totals.thisMonth ?? 0)}
            </div>
            <span className="text-xs text-[#7A8D9B] mt-1 block">Current month total</span>
          </div>

          <div className="bg-white border border-[#E4EBF0] rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[13px] text-[#7A8D9B] block mb-1">All-time revenue</span>
              <div className="text-2xl font-semibold text-[#0B1F3A]">
                {isLoading ? "—" : formatRwf(overview?.totals.allTime ?? 0)}
              </div>
              <span className="text-xs text-[#7A8D9B] mt-1 block">Lifetime collections</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setWithdrawSuccess(null);
                setWithdrawModalOpen(true);
              }}
              className="mt-3 w-full h-8 px-3 rounded-lg text-xs font-semibold bg-teal text-white hover:bg-teal-hover transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <ArrowUpRight size={14} />
              Withdraw to phone
            </button>
          </div>
        </div>

        {/* Revenue Breakdown by Plan & Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E4EBF0] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#7A8D9B] uppercase tracking-wider mb-3">
              Revenue by plan tier
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#0B1F3A]">Basic vault (1,000 RWF/mo)</span>
                <span className="text-sm font-semibold text-[#0B1F3A]">
                  {isLoading ? "—" : formatRwf(overview?.byPlan.Basic ?? 0)}
                </span>
              </div>
              <div className="w-full bg-[#F6F8FA] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#00A3B8] h-full"
                  style={{
                    width: `${
                      overview && overview.totals.allTime > 0
                        ? ((overview.byPlan.Basic || 0) / overview.totals.allTime) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E4EBF0]">
                <span className="text-sm font-medium text-[#0B1F3A]">Premium vault (5,000 RWF/mo)</span>
                <span className="text-sm font-semibold text-[#0B1F3A]">
                  {isLoading ? "—" : formatRwf(overview?.byPlan.Premium ?? 0)}
                </span>
              </div>
              <div className="w-full bg-[#F6F8FA] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0B1F3A] h-full"
                  style={{
                    width: `${
                      overview && overview.totals.allTime > 0
                        ? ((overview.byPlan.Premium || 0) / overview.totals.allTime) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E4EBF0] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[#7A8D9B] uppercase tracking-wider mb-3">
              Collections by payment method
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1 border-b border-[#E4EBF0]">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-[#00A3B8]" />
                  <span className="text-sm text-[#475B6B]">Mobile Money (MTN / Airtel)</span>
                </div>
                <span className="text-sm font-semibold text-[#0B1F3A]">
                  {isLoading ? "—" : formatRwf(overview?.byMethod.MOBILE_MONEY ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E4EBF0]">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[#7A8D9B]" />
                  <span className="text-sm text-[#475B6B]">Cards & Online Banking</span>
                </div>
                <span className="text-sm font-semibold text-[#0B1F3A]">
                  {isLoading ? "—" : formatRwf(overview?.byMethod.CARD ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7A8D9B]">Other methods</span>
                </div>
                <span className="text-sm font-semibold text-[#0B1F3A]">
                  {isLoading ? "—" : formatRwf(overview?.byMethod.OTHER ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table & Filters */}
        <div className="bg-white border border-[#E4EBF0] rounded-xl p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8D9B]" />
                <input
                  type="text"
                  placeholder="Search reference or patient..."
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

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-lg text-xs font-medium border border-[#E4EBF0] bg-white text-[#475B6B] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
              >
                <option value="ALL">All statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-9 px-3 rounded-lg text-xs font-medium border border-[#E4EBF0] bg-white text-[#475B6B] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
              >
                <option value="ALL">All plans</option>
                <option value="Basic">Basic</option>
                <option value="Premium">Premium</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-9 px-3 rounded-lg text-xs font-medium border border-[#E4EBF0] bg-white text-[#475B6B] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
              >
                <option value="ALL">All payment methods</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Credit/Debit Card</option>
              </select>
            </div>
          </div>

          <div className="border border-[#E4EBF0] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F6F8FA] border-b border-[#E4EBF0] text-xs font-semibold text-[#7A8D9B]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Patient (Masked)</th>
                    <th className="py-3 px-4">Plan tier</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EBF0]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[#7A8D9B]">
                        <LoaderCircle size={20} className="animate-spin mx-auto mb-2 text-[#00A3B8]" />
                        Loading transaction ledger...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[#7A8D9B]">
                        No transactions recorded for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F6F8FA]/60 transition-colors">
                        <td className="py-3 px-4 text-xs text-[#7A8D9B]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-semibold text-[#0B1F3A] block">
                            {tx.customerReference}
                          </span>
                          <span className="text-[11px] text-[#7A8D9B] font-mono">
                            {tx.gatewayReference}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#0B1F3A] block text-xs">
                            {tx.patientName}
                          </span>
                          <span className="text-[11px] text-[#7A8D9B]">
                            {tx.maskedPhone}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-[#0B1F3A]">
                          {tx.plan}
                        </td>
                        <td className="py-3 px-4 font-semibold text-xs text-[#0B1F3A]">
                          {formatRwf(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#475B6B]">
                          {tx.paymentMethod}
                        </td>
                        <td className="py-3 px-4">{renderStatusBadge(tx.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewDetail(tx.id)}
                            className="p-1.5 rounded-lg border border-[#E4EBF0] hover:bg-[#F6F8FA] text-[#475B6B] hover:text-[#0B1F3A] transition-colors"
                            title="View transaction details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transaction Detail Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs">
            <div className="bg-white border border-[#E4EBF0] rounded-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4EBF0] pb-3">
                <h3 className="text-base font-semibold text-[#0B1F3A]">Transaction audit detail</h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A] hover:bg-[#F6F8FA]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Reference</span>
                  <span className="font-mono font-semibold text-[#0B1F3A]">{selectedTx.customerReference}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Gateway Reference</span>
                  <span className="font-mono text-[#475B6B]">{selectedTx.gatewayReference}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Patient</span>
                  <span className="font-semibold text-[#0B1F3A]">{selectedTx.patientName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Phone (Masked)</span>
                  <span className="font-mono text-[#475B6B]">{selectedTx.maskedPhone}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Plan Tier</span>
                  <span className="font-semibold text-[#0B1F3A]">{selectedTx.plan}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Amount</span>
                  <span className="font-semibold text-sm text-[#0B1F3A]">{formatRwf(selectedTx.amount)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Payment Method</span>
                  <span className="text-[#475B6B]">{selectedTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Status</span>
                  <span>{renderStatusBadge(selectedTx.status)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#E4EBF0]">
                  <span className="text-[#7A8D9B]">Created At</span>
                  <span className="text-[#7A8D9B]">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#7A8D9B]">Updated At</span>
                  <span className="text-[#7A8D9B]">{new Date(selectedTx.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#E4EBF0]">
                <button
                  onClick={() => setSelectedTx(null)}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-[#475B6B] border border-[#E4EBF0] hover:bg-[#F6F8FA]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {withdrawModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0B1F3A]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-[#E4EBF0] shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4EBF0]">
                <div>
                  <h3 className="font-semibold text-[#0B1F3A] text-base">Withdraw funds</h3>
                  <p className="text-xs text-[#7A8D9B]">Transfer platform revenue to an authorized mobile wallet</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawModalOpen(false);
                    setWithdrawSuccess(null);
                  }}
                  className="p-1 rounded-lg text-[#7A8D9B] hover:text-[#0B1F3A] hover:bg-[#F6F8FA]"
                >
                  <X size={18} />
                </button>
              </div>

              {withdrawSuccess ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                      {withdrawSuccess}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawModalOpen(false);
                        setWithdrawSuccess(null);
                      }}
                      className="h-9 px-4 rounded-lg text-xs font-semibold bg-teal text-white hover:bg-teal-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                      Withdrawal amount (RWF)
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={100}
                      placeholder="e.g. 50000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full h-10 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
                    />
                    <span className="text-[11px] text-[#7A8D9B] mt-1 block">
                      Available: {formatRwf(overview?.totals.allTime ?? 0)} (Min: 1,000 RWF)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                      Destination mobile provider
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawTelco("MTN")}
                        className={`h-10 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          withdrawTelco === "MTN"
                            ? "border-[#00A3B8] bg-teal/10 text-teal ring-1 ring-[#00A3B8]"
                            : "border-[#E4EBF0] bg-white text-[#475B6B] hover:bg-[#F6F8FA]"
                        }`}
                      >
                        <Smartphone size={14} />
                        MTN MoMo
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawTelco("AIRTEL")}
                        className={`h-10 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          withdrawTelco === "AIRTEL"
                            ? "border-[#00A3B8] bg-teal/10 text-teal ring-1 ring-[#00A3B8]"
                            : "border-[#E4EBF0] bg-white text-[#475B6B] hover:bg-[#F6F8FA]"
                        }`}
                      >
                        <Smartphone size={14} />
                        Airtel Money
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                      Recipient phone number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0788123456"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="w-full h-10 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
                    />
                    <span className="text-[11px] text-[#7A8D9B] mt-1 block">
                      Payout will be transferred directly to this account via national payment switch
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                      Reason / Reference note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Platform monthly operating fund"
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      className="w-full h-10 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4EBF0]">
                    <button
                      type="button"
                      onClick={() => setWithdrawModalOpen(false)}
                      className="h-9 px-4 rounded-lg text-xs font-semibold text-[#475B6B] border border-[#E4EBF0] hover:bg-[#F6F8FA] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isWithdrawing}
                      className="h-9 px-4 rounded-lg text-xs font-semibold bg-teal text-white hover:bg-teal-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isWithdrawing ? (
                        <>
                          <LoaderCircle size={14} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Confirm withdrawal"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
