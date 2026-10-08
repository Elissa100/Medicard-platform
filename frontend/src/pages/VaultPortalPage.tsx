import { useState, useEffect } from "react";
import { FileText, ShieldCheck, Download, Upload, FolderOpen, Clock, Lock, Crown, CheckCircle2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

type SubscriptionPlan = "BASIC" | "PREMIUM" | null;

export default function VaultPortalPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<SubscriptionPlan>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      if (!userData) {
        window.location.href = "/patient-vault";
        return;
      }

      const patient = JSON.parse(userData);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      const response = await fetch(`${API_URL}/registration/subscription/${patient.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.subscription) {
        setSubscription(data.subscription);
        setPlan(data.subscription.plan);
      } else {
        // No active subscription, redirect to vault page
        window.location.href = "/patient-vault";
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-section-tint flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto mb-4"></div>
          <p className="text-body-text">Loading your vault...</p>
        </div>
      </div>
    );
  }

  const isPremium = plan === "PREMIUM";

  return (
    <div className="min-h-screen bg-section-tint py-8 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">Patient Vault Portal</h1>
            <p className="text-body-text">Your secure health records storage</p>
          </div>
          <div className="flex items-center gap-4">
            {subscription && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                isPremium ? "bg-navy text-teal" : "bg-teal text-white"
              }`}>
                {isPremium ? <Crown size={14} /> : <CheckCircle2 size={14} />}
                <span>{isPremium ? "Premium Vault" : "Basic Vault"}</span>
              </div>
            )}
            <button
              onClick={() => window.location.href = "/"}
              className="text-sm text-body-text hover:text-navy inline-flex items-center gap-1"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Plan Benefits Banner */}
        <div className={`mb-8 p-4 rounded-lg border ${
          isPremium ? "bg-navy border-teal text-white" : "bg-pale-cyan border-teal text-navy"
        }`}>
          <div className="flex items-center gap-3">
            {isPremium ? <Crown size={20} className="text-teal" /> : <ShieldCheck size={20} className="text-teal" />}
            <div>
              <p className="font-semibold text-sm">
                {isPremium ? "Premium Plan Active" : "Basic Plan Active"}
              </p>
              <p className="text-xs opacity-80">
                {isPremium
                  ? "Unlimited uploads, multi-sector linkage, priority backup"
                  : "Secure vault, unlimited clinical records, NFC data retrieval"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                <FileText size={20} className="text-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">12</p>
                <p className="text-xs text-body-text">Records</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                <FolderOpen size={20} className="text-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{isPremium ? "Unlimited" : "5"}</p>
                <p className="text-xs text-body-text">Documents</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pale-cyan rounded-full flex items-center justify-center">
                <ShieldCheck size={20} className="text-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">Active</p>
                <p className="text-xs text-body-text">Security</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy">Your Records</h2>
            {isPremium ? (
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal rounded-lg hover:bg-teal/90 transition-colors">
                <Upload size={16} />
                Upload
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-body-text bg-section-tint rounded-lg">
                <Lock size={16} />
                <span>Upload requires Premium</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-section-tint rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal" />
                <div>
                  <p className="font-semibold text-navy text-sm">Clinical Record - OPD Visit</p>
                  <p className="text-xs text-body-text">March 15, 2026</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Download size={16} className="text-body-text" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-section-tint rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal" />
                <div>
                  <p className="font-semibold text-navy text-sm">Laboratory Results - CBC Panel</p>
                  <p className="text-xs text-body-text">March 10, 2026</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Download size={16} className="text-body-text" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-section-tint rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal" />
                <div>
                  <p className="font-semibold text-navy text-sm">Prescription - Antibiotics</p>
                  <p className="text-xs text-body-text">March 5, 2026</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Download size={16} className="text-body-text" />
              </button>
            </div>
          </div>
        </div>

        {/* Premium-only features section */}
        {isPremium && (
          <div className="mt-6 bg-white border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-navy mb-4">Premium Features</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm text-body-text">
                <CheckCircle2 size={16} className="text-teal" />
                <span>Multi-sector linkage</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-body-text">
                <CheckCircle2 size={16} className="text-teal" />
                <span>Priority data backup</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-body-text">
                <CheckCircle2 size={16} className="text-teal" />
                <span>Unlimited document uploads</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 text-sm text-body-text">
            <Clock size={14} />
            <span>Last synced: Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
