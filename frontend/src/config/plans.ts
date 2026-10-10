export interface PlanFeature {
  text: string;
  active: boolean;
}

export interface VaultPlan {
  id: "BASIC" | "PREMIUM";
  name: string;
  displayName: string;
  price: string;
  amountRwf: number;
  period: string;
  subtitle: string;
  featured: boolean;
  features: PlanFeature[];
}

export const VAULT_PLANS: Record<"BASIC" | "PREMIUM", VaultPlan> = {
  BASIC: {
    id: "BASIC",
    name: "Basic",
    displayName: "Basic Vault",
    price: "1,000 RWF",
    amountRwf: 1000,
    period: "/ month",
    subtitle: "Essential personal digital health record access and clinic history.",
    featured: false,
    features: [
      { text: "Unlimited basic clinical records", active: true },
      { text: "Emergency contacts and allergy profile", active: true },
      { text: "View consultation history", active: true },
      { text: "MedCard NFC card synchronization", active: true },
      { text: "Document uploads and family profiles", active: false },
    ],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    displayName: "Premium Vault",
    price: "5,000 RWF",
    amountRwf: 5000,
    period: "/ month",
    subtitle: "Complete family health management, laboratory reports, and digital document storage.",
    featured: true,
    features: [
      { text: "Includes everything in Basic", active: true },
      { text: "Full family and dependent profiles", active: true },
      { text: "Lab reports, imaging and PDF document storage", active: true },
      { text: "Direct clinic appointment booking", active: true },
      { text: "Priority clinical data export and support", active: true },
    ],
  },
};

