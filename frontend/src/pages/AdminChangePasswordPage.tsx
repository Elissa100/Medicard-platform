import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, KeyRound } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";
const ADMIN_TOKEN_KEY = "medcard_admin_token";

export default function AdminChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters.");
      return;
    }

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/admin/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Password change failed.");
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Something went wrong."
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <KeyRound size={18} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#0B1F3A]">Set a new password</h1>
              <p className="text-xs text-[#7A8D9B]">Required before you can continue</p>
            </div>
          </div>

          <p className="text-sm text-[#475B6B] mb-6 pl-12">
            Your account was created with a temporary password. Please set a strong password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-[#0B1F3A] mb-1.5">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] placeholder:text-[#7A8D9B]"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-[#0B1F3A] mb-1.5">
                New password
                <span className="ml-1 text-xs font-normal text-[#7A8D9B]">(min 12 characters)</span>
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] placeholder:text-[#7A8D9B]"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-[#0B1F3A] mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-9 px-3 border border-[#E4EBF0] rounded-lg text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#00A3B8] placeholder:text-[#7A8D9B]"
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
              {isLoading ? "Saving..." : "Set new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

