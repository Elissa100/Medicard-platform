import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  vaultClinicChangePassword,
  getVaultClinicStaff,
} from "../../services/vault-clinic";
import { KeyRound, LoaderCircle, AlertCircle, CheckCircle2 } from "lucide-react";

export default function VaultClinicChangePasswordPage() {
  const navigate = useNavigate();
  const staff = getVaultClinicStaff();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("New password must include at least one uppercase letter, one lowercase letter, and one number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await vaultClinicChangePassword(currentPassword, newPassword);
      if (staff?.role === "CLINIC_ADMIN") {
        navigate("/vault-clinic/settings");
      } else {
        navigate("/vault-clinic/appointments");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password. Please check your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-50 shadow-xs border border-amber-200 text-amber-700 mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Change Temporary Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          For your account security, you must choose a new personal password before accessing the workspace.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-8">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Current Temporary Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter the password from your invitation email"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Password requirements:</p>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${newPassword.length >= 8 ? "text-emerald-600" : "text-slate-400"}`} />
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}`} />
                <span>Uppercase and lowercase letters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${/[0-9]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}`} />
                <span>At least one number</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full h-10 inline-flex items-center justify-center rounded-xl bg-teal text-xs font-semibold text-white shadow-sm hover:bg-teal/90 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff" }}>Updating password...</span>
                </>
              ) : (
                <span style={{ color: "#ffffff" }}>Set New Password & Enter Portal</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

