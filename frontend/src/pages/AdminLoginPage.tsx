import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, ShieldCheck } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";

export const ADMIN_TOKEN_KEY = "medcard_admin_token";
export const ADMIN_DATA_KEY = "medcard_admin_data";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to sign in.");
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, data.data.token);
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data.data.user));

      if (data.data.mustChangePassword) {
        navigate("/admin/change-password", { replace: true });
      } else {
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/medcard-logo.svg" alt="MedCard" className="h-7" />
        </div>

        <div className="bg-white border border-[#E4EBF0] rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#EEF9FB] flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-[#00A3B8]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#0B1F3A]">Platform admin</h1>
              <p className="text-xs text-[#7A8D9B]">MedCard internal access only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-[#0B1F3A] mb-1.5">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] placeholder:text-[#7A8D9B]"
                placeholder="admin@medcard.rw"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-[#0B1F3A] mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] placeholder:text-[#7A8D9B]"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div role="alert" className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 h-9 text-sm font-semibold text-white bg-[#00A3B8] rounded-lg hover:bg-[#008FA2] transition-colors disabled:opacity-50"
            >
              {isLoading && <LoaderCircle size={15} className="animate-spin" />}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#7A8D9B] mt-6">
          This login is restricted to MedCard platform administrators.
        </p>
      </div>
    </div>
  );
}

