import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  LockKeyhole,
  MapPin,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  LoaderCircle,
  Hospital,
} from "lucide-react";

const FACILITY_KEY = "medcard_current_facility";
const AUTH_TOKEN_KEY = "medcard_auth_token";
const USER_DATA_KEY = "medcard_user_data";

const API_URL = import.meta.env.VITE_API_URL || "https://medicard-platform.onrender.com/api/v1";

type FacilityType = "Hospital" | "Clinic";

function FacilityLoginPage() {
  const navigate = useNavigate();

  const [facilityType, setFacilityType] = useState<FacilityType>("Hospital");
  const [facilityName, setFacilityName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    // Clear any existing auth
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem("medcard_authenticated");
    localStorage.removeItem(FACILITY_KEY);
    navigate("/");
  };

  const handleFacilityLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter the authorized facility email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter the facility password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/facility/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          facilityName: facilityName.trim(),
          location: location.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Facility login failed");
        setIsLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data.user));
      localStorage.setItem(FACILITY_KEY, JSON.stringify(data.data.facility));
      localStorage.setItem("medcard_authenticated", "true");

      setIsVerifying(true);

      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch {
      setError("Failed to connect to server. Please try again.");
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="h-screen bg-section-tint flex items-center justify-center">
        <div className="max-w-md w-full px-5 text-center">
          <img
            src="/medcard-logo.svg"
            alt="MedCard"
            className="h-16 w-auto mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-navy mb-2">Verifying facility access</h1>
          <p className="text-body-text mb-8">
            Establishing your authorized facility session before opening the clinical workspace.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal" />
            <div className="w-3 h-3 rounded-full bg-teal" />
            <div className="w-3 h-3 rounded-full bg-teal animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-section-tint flex flex-col">
      {/* Top bar */}
      <div className="w-full px-5 py-4 md:px-10 lg:px-16 flex items-center justify-between flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-body-text hover:text-navy transition-colors"
        >
          <ArrowLeft size={18} />
          <span>MedCard home</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-sm font-semibold text-teal hover:text-navy transition-colors"
        >
          Staff login →
        </button>
      </div>

      {/* Main content — fills remaining height */}
      <div className="flex-1 min-h-0 flex items-center px-5 pb-5 md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-6xl h-full max-h-[720px] overflow-hidden rounded-[28px] bg-white shadow-card lg:grid lg:grid-cols-[0.9fr_1.1fr]">

          {/* Left panel — desktop only */}
          <aside className="hidden lg:flex flex-col justify-between bg-navy p-10 text-white">
            <div>
              <div className="flex items-center gap-3">
                <img src="/medcard-logo.svg" alt="MedCard" className="h-12 w-auto brightness-0 invert" />
                <div>
                  <h1 className="text-xl font-bold">MedCard</h1>
                  <p className="text-sm text-soft-text-on-navy">Healthcare facility portal</p>
                </div>
              </div>

              <div className="mt-16">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/15 text-teal">
                  <Hospital size={28} />
                </div>
                <h2 className="text-3xl font-bold leading-tight">Authorized facility access.</h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-soft-text-on-navy">
                  Sign in with your facility's authorized credentials. Each facility account grants access to its own clinical workspace.
                </p>
              </div>
            </div>
            <p className="text-xs text-soft-text-on-navy">MedCard Health Systems · Rwanda</p>
          </aside>

          {/* Right panel — the form */}
          <div className="flex flex-col h-full overflow-y-auto p-6 sm:p-8 lg:px-10 lg:py-7">
            {/* Mobile logo */}
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <img
                src="/medcard-logo.svg"
                alt="MedCard"
                className="h-10 w-auto cursor-pointer"
                onClick={handleBack}
              />
              <div>
                <h1 className="text-navy font-bold text-xl">MedCard</h1>
                <p className="text-body-text text-sm">Healthcare facility portal</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-pale-cyan rounded-full mb-5 w-fit">
              <LockKeyhole size={14} className="text-teal" />
              <span className="text-xs font-semibold text-teal">Authorized access</span>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-bold text-navy">Enter your facility</h2>
              <p className="mt-1 text-sm text-body-text">Sign in for an authorized hospital or clinic.</p>
            </div>

            <div className="bg-section-tint rounded-xl p-3 mb-5 flex items-start gap-3">
              <ShieldCheck size={18} className="text-teal flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-navy text-sm">Authorized facilities only</strong>
                <p className="text-body-text text-xs">Access is restricted to approved healthcare facilities.</p>
              </div>
            </div>

            <form onSubmit={handleFacilityLogin} className="space-y-4 flex-1">
              {/* Facility type + name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="facility-type" className="block text-sm font-semibold text-navy mb-2">
                    Facility type
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                    <select
                      id="facility-type"
                      value={facilityType}
                      onChange={(event) => setFacilityType(event.target.value as FacilityType)}
                      className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl appearance-none bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 text-sm"
                    >
                      <option value="Hospital">Hospital</option>
                      <option value="Clinic">Clinic</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="facility-name" className="block text-sm font-semibold text-navy mb-2">
                    Facility name
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                    <input
                      id="facility-name"
                      type="text"
                      placeholder="Hospital or clinic name"
                      value={facilityName}
                      onChange={(event) => setFacilityName(event.target.value)}
                      autoComplete="organization"
                      className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="facility-location" className="block text-sm font-semibold text-navy mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                  <input
                    id="facility-location"
                    type="text"
                    placeholder="City / District"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    autoComplete="address-level2"
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="facility-email" className="block text-sm font-semibold text-navy mb-2">
                  Authorized email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                  <input
                    id="facility-email"
                    type="email"
                    placeholder="Enter facility email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="facility-password" className="block text-sm font-semibold text-navy mb-2">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-text" />
                  <input
                    id="facility-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 border border-border rounded-xl bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-text hover:text-teal"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <ShieldCheck size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center h-11 px-6 text-sm font-semibold text-white bg-teal rounded-full hover:bg-teal-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin mr-2" />
                    Verifying facility...
                  </>
                ) : (
                  <>
                    Enter Authorized Facility Portal
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <ShieldCheck size={14} className="text-teal flex-shrink-0" />
              <span className="text-xs text-body-text">Your facility session is protected. Clinical staff access is selected in the next step.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacilityLoginPage;
