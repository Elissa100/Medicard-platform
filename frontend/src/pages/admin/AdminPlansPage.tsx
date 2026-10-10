import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { fetchPlans, getAdminData } from "../../services/admin";
import {
  Check,
  CreditCard,
  Users,
  RefreshCw,
} from "lucide-react";

interface PlanItem {
  id: string;
  name: string;
  priceRwf: number;
  billingCycle: string;
  description: string;
  activeSubscribers: number;
  features: string[];
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const admin = getAdminData();

  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPlans();
      setPlans(data.plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
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
      pageTitle="Patient Vault plans and configuration"
      pageSubtitle="Subscription tiers, pricing rules, and active subscriber metrics"
      activeNavId="plans"
      userDisplayName={admin.firstName ? `${admin.firstName} ${admin.lastName}` : "Platform Admin"}
      userEmail={admin.email || "admin@medcard.rw"}
      actionButton={{
        label: "Refresh",
        onClick: loadPlans,
        icon: <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />,
      }}
    >
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isPremium = plan.id === "PREMIUM";

            return (
              <div
                key={plan.id}
                className={`bg-white border rounded-xl p-6 flex flex-col justify-between ${
                  isPremium ? "border-[#00A3B8]/40 ring-1 ring-[#00A3B8]/20" : "border-[#E4EBF0]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-semibold text-[#7A8D9B] uppercase tracking-wider block mb-1">
                        Vault tier
                      </span>
                      <h3 className="text-xl font-bold text-[#0B1F3A]">{plan.name}</h3>
                    </div>
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EEF9FB] text-[#00A3B8] border border-[#00A3B8]/20">
                        <CreditCard size={12} />
                        Physical NFC Card Included
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F6F8FA] text-[#7A8D9B] border border-[#E4EBF0]">
                        Digital Vault
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#475B6B] mb-6">{plan.description}</p>

                  <div className="p-4 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] mb-6 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-bold text-[#0B1F3A]">
                        {formatRwf(plan.priceRwf)}
                      </span>
                      <span className="text-xs text-[#7A8D9B] ml-1.5">/ month</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-[#7A8D9B]">
                        <Users size={12} />
                        <span>Active subscribers</span>
                      </div>
                      <div className="text-base font-semibold text-[#0B1F3A]">
                        {isLoading ? "—" : plan.activeSubscribers.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-[#0B1F3A] block">
                      Included capabilities
                    </span>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#475B6B]">
                          <Check size={14} className="text-[#00A3B8] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E4EBF0] flex items-center justify-between text-xs text-[#7A8D9B]">
                  <span>Status: Active for public subscription</span>
                  <span className="font-mono text-[11px] bg-[#F6F8FA] px-2 py-0.5 rounded border border-[#E4EBF0]">
                    tier_{plan.id.toLowerCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
