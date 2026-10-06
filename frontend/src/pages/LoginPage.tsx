import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Stethoscope,
  HeartPulse,
  UserRound,
  FlaskConical,
  Pill,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export type Role =
  | "Reception"
  | "Doctor"
  | "Nurse"
  | "Laboratory"
  | "Pharmacy"
  | "Cashier";

const CURRENT_ROLE_KEY = "medcard_current_role";

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
  const [username, setUsername] = useState("staff.reception@kfh.rw");
  const [password, setPassword] = useState("••••••••••••");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setUsername(`staff.${role.toLowerCase()}@kfh.rw`);
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem(CURRENT_ROLE_KEY, selectedRole);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-section-tint">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-20 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
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

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-[32px] shadow-card p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center cursor-pointer" onClick={() => navigate("/")}>
                <Activity size={24} className="text-teal" />
              </div>
              <div>
                <h1 className="text-navy font-bold text-xl">MedCard</h1>
                <p className="text-body-text text-sm">Rwanda Digital Health Grid</p>
              </div>
            </div>

            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 bg-pale-cyan rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={24} className="text-teal" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy mb-1">Welcome to MedCard</h2>
                <p className="text-body-text text-sm">Select your staff workspace role to access clinical tools.</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-navy mb-3">Select Clinical Workspace Role</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const selected = selectedRole === role.name;

                  return (
                    <button
                      key={role.name}
                      type="button"
                      onClick={() => handleRoleSelect(role.name)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
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

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-navy mb-2">
                  Clinical Workstation Username / Email
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="e.g. staff.doctor@kfh.rw"
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
                  <button
                    type="button"
                    onClick={() => alert("Demo Mode: Click Sign In directly!")}
                    className="text-xs font-semibold text-teal hover:text-navy"
                  >
                    Demo auto-filled
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
                />
              </div>

              <div className="flex items-center gap-2 px-4 py-3 bg-pale-cyan rounded-xl">
                <ShieldCheck size={16} className="text-teal" />
                <span className="text-sm text-body-text">
                  Encrypted via Rwanda MoH E-Health Standards. Smart MedCard contactless token authentication active.
                </span>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center h-14 px-6 text-base font-semibold text-white bg-navy rounded-full hover:bg-mid-blue transition-colors"
              >
                Sign in as {selectedRole} →
              </button>
            </form>

            <div className="flex items-center gap-2 pt-6 border-t border-border text-center justify-center text-body-text text-sm">
              <span>MedCard Health Systems</span>
              <span>•</span>
              <span>King Faisal Hospital Kigali</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
