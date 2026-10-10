import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { fetchOverview, getAdminData } from "../services/admin";
import {
  Building2,
  Users,
  CalendarDays,
  CreditCard,
  Layers,
  CircleDollarSign,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface OverviewData {
  counts: {
    clinics: number;
    activeClinics: number;
    patients: number;
    cardsIssued: number;
    activeSubscriptions: number;
    todayAppointments: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    currency: string;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const admin = getAdminData();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchOverview();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overview");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRwf = (amount: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout
      currentRole="platform_admin"
      pageTitle="Platform overview"
      pageSubtitle="MedCard healthcare platform metrics and status"
      activeNavId="overview"
      userDisplayName={admin.firstName ? `${admin.firstName} ${admin.lastName}` : "Platform Admin"}
      userEmail={admin.email || "admin@medcard.rw"}
      actionButton={{
        label: "Refresh",
        onClick: loadData,
        icon: <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />,
      }}
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="text-xs font-semibold underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Top KPI Cards (Counts Only) */}
        <div>
          <h2 className="text-sm font-semibold text-[#0B1F3A] mb-3">Platform reach</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#7A8D9B]">Partner clinics</span>
                <Building2 size={16} className="text-[#7A8D9B]" />
              </div>
              <div className="text-2xl font-semibold text-[#0B1F3A]">
                {isLoading ? "—" : data?.counts.clinics ?? 0}
              </div>
              <div className="text-xs text-[#7A8D9B] mt-1">
                {isLoading ? "Loading..." : `${data?.counts.activeClinics ?? 0} active facilities`}
              </div>
            </div>

            <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#7A8D9B]">Registered patients</span>
                <Users size={16} className="text-[#7A8D9B]" />
              </div>
              <div className="text-2xl font-semibold text-[#0B1F3A]">
                {isLoading ? "—" : (data?.counts.patients ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-[#7A8D9B] mt-1">
                Across all clinic networks
              </div>
            </div>

            <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#7A8D9B]">Appointments today</span>
                <CalendarDays size={16} className="text-[#7A8D9B]" />
              </div>
              <div className="text-2xl font-semibold text-[#0B1F3A]">
                {isLoading ? "—" : data?.counts.todayAppointments ?? 0}
              </div>
              <div className="text-xs text-[#7A8D9B] mt-1">
                Scheduled for today
              </div>
            </div>

            <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#7A8D9B]">Active subscriptions</span>
                <Layers size={16} className="text-[#7A8D9B]" />
              </div>
              <div className="text-2xl font-semibold text-[#0B1F3A]">
                {isLoading ? "—" : (data?.counts.activeSubscriptions ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-[#7A8D9B] mt-1">
                Basic and Premium vault plans
              </div>
            </div>

            <div className="bg-white border border-[#E4EBF0] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#7A8D9B]">NFC cards issued</span>
                <CreditCard size={16} className="text-[#7A8D9B]" />
              </div>
              <div className="text-2xl font-semibold text-[#0B1F3A]">
                {isLoading ? "—" : (data?.counts.cardsIssued ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-[#7A8D9B] mt-1">
                Physical cards distributed
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Summary Section */}
        <div>
          <h2 className="text-sm font-semibold text-[#0B1F3A] mb-3">Revenue summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E4EBF0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#7A8D9B]">Total platform revenue</span>
                <CircleDollarSign size={16} className="text-[#7A8D9B]" />
              </div>
              <div className="text-2xl font-semibold text-[#0B1F3A]">
                {isLoading ? "—" : formatRwf(data?.revenue.total ?? 0)}
              </div>
              <div className="text-xs text-[#7A8D9B] mt-1">
                All-time collected across plans
              </div>
            </div>

            <div className="bg-white border border-[#E4EBF0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#7A8D9B]">Revenue this month</span>
                <TrendingUp size={16} className="text-[#7A8D9B]" />
              </div>
              <div className="text-2xl font-semibold text-[#0B1F3A]">
                {isLoading ? "—" : formatRwf(data?.revenue.thisMonth ?? 0)}
              </div>
              <div className="text-xs text-[#7A8D9B] mt-1">
                Current calendar month
              </div>
            </div>

            <div className="bg-white border border-[#E4EBF0] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[13px] text-[#7A8D9B] block mb-1">Financial operations</span>
                <p className="text-xs text-[#475B6B]">
                  Detailed breakdown by payment method, plan, transaction filtering, and CSV export.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/admin/finance"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A3B8] hover:text-[#008FA2]"
                >
                  <span>Open finance workspace</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links & Platform Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E4EBF0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-[#00A3B8]" />
              <h3 className="text-sm font-semibold text-[#0B1F3A]">Platform security posture</h3>
            </div>
            <div className="space-y-2.5 text-xs text-[#475B6B]">
              <div className="flex items-center justify-between py-1 border-b border-[#E4EBF0]">
                <span>Admin authentication rate limiting</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  Active (10 req/15m)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#E4EBF0]">
                <span>Security audit logging</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  Enforced
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Patient medical record isolation</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  Strictly isolated
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E4EBF0] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#0B1F3A] mb-3">Management shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/admin/clinics"
                className="p-3 rounded-lg border border-[#E4EBF0] hover:bg-[#F6F8FA] transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-[#0B1F3A]">Manage clinics</span>
                <ArrowUpRight size={13} className="text-[#7A8D9B]" />
              </Link>
              <Link
                to="/admin/users"
                className="p-3 rounded-lg border border-[#E4EBF0] hover:bg-[#F6F8FA] transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-[#0B1F3A]">User accounts</span>
                <ArrowUpRight size={13} className="text-[#7A8D9B]" />
              </Link>
              <Link
                to="/admin/cards"
                className="p-3 rounded-lg border border-[#E4EBF0] hover:bg-[#F6F8FA] transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-[#0B1F3A]">Link NFC card</span>
                <ArrowUpRight size={13} className="text-[#7A8D9B]" />
              </Link>
              <Link
                to="/admin/audit-log"
                className="p-3 rounded-lg border border-[#E4EBF0] hover:bg-[#F6F8FA] transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-[#0B1F3A]">Review audit log</span>
                <ArrowUpRight size={13} className="text-[#7A8D9B]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
