import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  HeartPulse,
  UserRound,
  FlaskConical,
  Pill,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";

export type Role =
  | "Reception"
  | "Doctor"
  | "Nurse"
  | "Laboratory"
  | "Pharmacy"
  | "Cashier";

const CURRENT_ROLE_KEY = "medcard_current_role";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";

const roles: {
  name: Role;
  icon: typeof UserRound;
}[] = [
  { name: "Reception", icon: UserRound },
  { name: "Doctor", icon: Stethoscope },
  { name: "Nurse", icon: HeartPulse },
  { name: "Laboratory", icon: FlaskConical },
  { name: "Pharmacy", icon: Pill },
  { name: "Cashier", icon: CreditCard },
];

function LoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>("Reception");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/staff/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Login failed");
        setIsLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data.user));
      localStorage.setItem(CURRENT_ROLE_KEY, data.data.user.role);
      localStorage.setItem("medcard_authenticated", "true");

      navigate("/dashboard");
    } catch {
      setError("Failed to connect to server. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-section-tint lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-5 md:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-body-text hover:text-navy transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Landing</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/facility-login")}
            className="text-sm font-semibold text-teal hover:text-navy transition-colors"
          >
            Facility Authentication →
          </button>
        </div>

      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 items-center px-5 pb-5 md:px-10 lg:min-h-0 lg:px-16 lg:pb-8">
        <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-card lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
            <div>
              <div className="flex items-center gap-3">
                <img src="/medcard-logo.svg" alt="MedCard" className="h-12 w-auto brightness-0 invert" />
                <div>
                  <h1 className="text-xl font-bold">MedCard</h1>
                  <p className="text-sm text-soft-text-on-navy">Clinical workspace</p>
                </div>
              </div>
              <div className="mt-16">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/15 text-teal">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-3xl font-bold leading-tight">Secure access for your care team.</h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-soft-text-on-navy">
                  Sign in to the clinical workspace assigned to your role. Contact your facility administrator if you need account access.
                </p>
              </div>
            </div>
            <p className="text-xs text-soft-text-on-navy">MedCard Health Systems · Rwanda</p>
          </aside>

          <div className="p-6 sm:p-8 lg:px-10 lg:py-7">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <img
                src="/medcard-logo.svg"
                alt="MedCard"
                className="h-10 w-auto cursor-pointer"
                onClick={() => navigate("/")}
              />
              <div>
                <h1 className="text-navy font-bold text-xl">MedCard</h1>
                <p className="text-body-text text-sm">Clinical workspace</p>
              </div>
            </div>

            <div className="mb-5">
              <div>
                <h2 className="text-2xl font-bold text-navy">Welcome to MedCard</h2>
                <p className="mt-1 text-sm text-body-text">Select your role and enter your staff credentials.</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-navy">Clinical workspace role</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const selected = selectedRole === role.name;

                  return (
                    <button
                      key={role.name}
                      type="button"
                      onClick={() => handleRoleSelect(role.name)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-2.5 transition-all sm:gap-2 sm:py-3 ${
                        selected
                          ? "border-teal bg-pale-cyan"
                          : "border-border hover:border-teal"
                      }`}
                    >
                      <Icon size={20} className={selected ? "text-teal" : "text-body-text"} />
                      <span className={`text-sm font-semibold ${selected ? "text-teal" : "text-body-text"}`}>
                        {role.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-navy mb-2">
                  Clinical Workstation Username / Email
                </label>
                <input
                  id="username"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="Enter your work email"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-navy">
                    Security PIN / Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <ShieldCheck size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-xl bg-pale-cyan px-3 py-2.5">
                <ShieldCheck size={16} className="text-teal" />
                <span className="text-xs leading-5 text-body-text">
                  Sign-in is protected. Your role determines which clinical tools you can access.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex h-12 items-center justify-center rounded-full bg-navy px-6 text-base font-semibold text-white transition-colors hover:bg-mid-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={20} className="animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  `Sign in as ${selectedRole} →`
                )}
              </button>
            </form>

            <div className="mt-4 border-t border-border pt-3 text-center text-xs text-body-text">
              MedCard Health Systems · Rwanda
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
