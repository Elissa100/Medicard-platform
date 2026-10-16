import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle, Mail, Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Step 1: Request verification code
  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not send verification code.");
      }

      setNotice(data.message || "A 6-digit verification code has been sent to your email.");
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit code & new password
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not reset password.");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-section-tint py-8 md:py-16">
      <div className="max-w-xl mx-auto px-4">
        <Link
          to="/patient-vault/login"
          className="text-sm text-body-text hover:text-navy mb-6 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Sign In
        </Link>

        <div className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-xs">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center mx-auto mb-3.5">
              {step === "success" ? (
                <CheckCircle2 size={24} className="text-emerald-600" />
              ) : (
                <KeyRound size={22} className="text-teal" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-navy tracking-tight">
              {step === "request" && "Reset your password"}
              {step === "verify" && "Enter verification code"}
              {step === "success" && "Password reset complete"}
            </h1>
            <p className="text-sm text-body-text mt-1.5 max-w-sm mx-auto">
              {step === "request" &&
                "Enter your registered account email and we'll send you a 6-digit verification code."}
              {step === "verify" &&
                `We sent a 6-digit verification code to ${email}. Check your inbox and enter it below.`}
              {step === "success" &&
                "Your password has been successfully updated. You can now sign in with your new password."}
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div role="alert" className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {notice && step !== "success" && (
            <div role="status" className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
              {notice}
            </div>
          )}

          {/* Step 1: Request Code Form */}
          {step === "request" && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-semibold text-navy mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-3.5 text-[#7A8D9B]" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full inline-flex items-center justify-center gap-2 h-11 text-sm font-semibold text-white bg-teal rounded-xl hover:bg-teal/90 transition-colors disabled:opacity-50 mt-2"
              >
                {isLoading && <LoaderCircle size={16} className="animate-spin" />}
                <span>{isLoading ? "Sending code..." : "Send verification code"}</span>
              </button>
            </form>
          )}

          {/* Step 2: Verification Code & New Password */}
          {step === "verify" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="verify-code" className="block text-sm font-semibold text-navy mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  id="verify-code"
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-center text-lg font-mono tracking-widest text-navy focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-navy mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-4 pr-11 py-2.5 border border-border rounded-xl text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#7A8D9B] hover:text-navy p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-navy mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !code.trim() || !newPassword}
                className="w-full inline-flex items-center justify-center gap-2 h-11 text-sm font-semibold text-white bg-teal rounded-xl hover:bg-teal/90 transition-colors disabled:opacity-50 mt-2"
              >
                {isLoading && <LoaderCircle size={16} className="animate-spin" />}
                <span>{isLoading ? "Updating password..." : "Set new password"}</span>
              </button>

              <div className="flex items-center justify-between text-xs text-body-text pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  className="hover:underline text-teal font-medium"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isLoading}
                  className="hover:underline text-teal font-medium"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success Screen */}
          {step === "success" && (
            <div className="text-center space-y-5 py-2">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
                Your password has been changed. You can now use your new password to sign in.
              </div>

              <Link
                to="/patient-vault/login"
                className="w-full inline-flex items-center justify-center h-11 text-sm font-semibold text-white bg-teal rounded-xl hover:bg-teal/90 transition-colors"
              >
                Sign In to Patient Vault
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

