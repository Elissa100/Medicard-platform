import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vaultClinicLogin } from "../../services/vault-clinic";
import { Lock, Mail, LoaderCircle, AlertCircle } from "lucide-react";

export default function VaultClinicLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await vaultClinicLogin(email.trim(), password);
      if (result.staff?.mustChangePassword) {
        navigate("/vault-clinic/change-password");
      } else if (result.staff?.role === "CLINIC_ADMIN") {
        navigate("/vault-clinic/settings");
      } else {
        navigate("/vault-clinic/appointments");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white shadow-xs border border-slate-200 mb-3">
          <img src="/medcard-logo.svg" alt="MedCard" className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Patient Vault Clinic Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to access appointment requests and patient vault data
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
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinic.rw"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full h-9 inline-flex items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  Verifying credentials...
                </>
              ) : (
                "Sign In to Clinic Workspace"
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center space-y-2">
            <p className="text-[11px] text-slate-400">
              Need access? Contact your clinic administrator to receive your account invitation.
            </p>
            <p className="text-xs text-slate-500 pt-1">
              Looking for your personal health records?{" "}
              <Link to="/patient-vault/login" className="font-semibold text-teal-600 hover:text-teal-700">
                Patient Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

