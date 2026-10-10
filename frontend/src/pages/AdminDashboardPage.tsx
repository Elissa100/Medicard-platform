import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";

const ADMIN_TOKEN_KEY = "medcard_admin_token";
const ADMIN_DATA_KEY = "medcard_admin_data";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  const adminData = (() => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_DATA_KEY) || "{}");
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-10 h-10 rounded-xl bg-[#EEF9FB] flex items-center justify-center mb-4">
        <LayoutDashboard size={20} className="text-[#00A3B8]" />
      </div>

      <h1 className="text-xl font-semibold text-[#0B1F3A] mb-1">
        Platform admin dashboard
      </h1>

      <p className="text-sm text-[#475B6B] mb-2">
        Signed in as <span className="font-medium text-[#0B1F3A]">{adminData.email}</span>
      </p>

      <p className="text-xs text-[#7A8D9B] mb-8 max-w-sm">
        The full admin dashboard is coming soon. For now your account is active and you can manage the platform via the API.
      </p>

      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-[#475B6B] border border-[#E4EBF0] bg-white rounded-lg hover:border-[#0B1F3A] hover:text-[#0B1F3A] transition-colors"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  );
}

