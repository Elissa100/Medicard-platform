import { CreditCard, CheckCircle2, LoaderCircle } from "lucide-react";
import type { VaultSubscription } from "./types";
import { VAULT_PLANS } from "../../config/plans";
import { PageHeader, Card, StatusBadge } from "./components/ui";

export interface VaultBillingTabProps {
  subscription: VaultSubscription | null;
  isPremium: boolean;
  isPaying: boolean;
  paymentPhone: string;
  onPaymentPhoneChange: (phone: string) => void;
  onUpgradePlan: () => Promise<void>;
}

export default function VaultBillingTab({
  subscription,
  isPremium,
  isPaying,
  paymentPhone,
  onPaymentPhoneChange,
  onUpgradePlan,
}: VaultBillingTabProps) {
  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader
        title="Plan and billing"
        description="Manage your MedCard Patient Vault subscription tier"
      />

      <Card title="Current plan">
        {/* Active tier row */}
        <div className="flex items-center justify-between py-3 border-b border-[#E4EBF0]">
          <div>
            <span className="text-[12px] text-[#7A8D9B] block mb-0.5">Active tier</span>
            <h3 className="text-[22px] font-semibold text-[#0F2942] leading-none">
              {isPremium ? VAULT_PLANS.PREMIUM.displayName : VAULT_PLANS.BASIC.displayName}
            </h3>
            <p className="text-[13px] text-[#475B6B] mt-1">
              {isPremium ? VAULT_PLANS.PREMIUM.price : VAULT_PLANS.BASIC.price}{" "}
              {VAULT_PLANS.BASIC.period}
            </p>
          </div>
          <StatusBadge
            status={subscription?.status || "Active"}
            variant="green"
          />
        </div>

        {/* Plan features */}
        {isPremium ? (
          <div className="flex items-center gap-2 pt-3 text-[13px] text-[#475B6B]">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>You have access to all Premium features including family profiles and full record history.</span>
          </div>
        ) : (
          <div className="pt-4 space-y-4">
            <div>
              <h4 className="text-[14px] font-semibold text-[#0F2942]">
                Upgrade to {VAULT_PLANS.PREMIUM.displayName}
              </h4>
              <p className="text-[13px] text-[#475B6B] mt-0.5">{VAULT_PLANS.PREMIUM.subtitle}</p>
              <p className="text-[22px] font-semibold text-[#0F2942] mt-2 leading-none">
                {VAULT_PLANS.PREMIUM.price}
                <span className="text-[13px] font-normal text-[#7A8D9B] ml-1">
                  {VAULT_PLANS.BASIC.period}
                </span>
              </p>
            </div>

            <div>
              <label className="text-[13px] font-medium text-[#475B6B] block">
                Mobile Money number (MTN / Airtel)
              </label>
              <input
                value={paymentPhone}
                onChange={(e) => onPaymentPhoneChange(e.target.value)}
                placeholder="2507XXXXXXXX"
                className="w-full h-9 text-[14px] rounded-lg border border-[#E4EBF0] px-3 bg-white mt-1 text-[#0F2942] focus:outline-none focus:ring-1 focus:ring-[#007C8C]"
              />
            </div>

            <button
              type="button"
              onClick={onUpgradePlan}
              disabled={isPaying || !paymentPhone.trim()}
              className="w-full h-9 rounded-lg bg-[#003F66] hover:bg-[#003252] text-white font-semibold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {isPaying ? (
                <>
                  <LoaderCircle size={14} className="animate-spin text-white" />
                  <span>Awaiting payment approval...</span>
                </>
              ) : (
                <>
                  <CreditCard size={15} className="text-white" />
                  <span>Pay with Mobile Money ({VAULT_PLANS.PREMIUM.price})</span>
                </>
              )}
            </button>
            <p className="text-[12px] text-[#7A8D9B] text-center">
              Securely processed via XentriPay Rwanda. You will receive a push prompt on your phone.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

