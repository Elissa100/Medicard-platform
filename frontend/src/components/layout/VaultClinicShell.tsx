import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Settings,
  ScrollText,
  LogOut,
  SlidersHorizontal,
  FolderLock,
  Building2,
  Menu,
  X,
} from "lucide-react";
import {
  getVaultClinicStaff,
  vaultClinicLogout,
  type VaultStaffSession,
} from "../../services/vault-clinic";

interface VaultClinicShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  activeNavId?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export default function VaultClinicShell({
  children,
  pageTitle,
  pageSubtitle,
  activeNavId,
  actionButton,
}: VaultClinicShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const staff: VaultStaffSession | null = getVaultClinicStaff();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await vaultClinicLogout();
    navigate("/vault-clinic/login");
  };

  const role = staff?.role || "RECEPTIONIST";

  // Build role-tailored navigation items
  const navItems = [];

  if (role === "CLINIC_ADMIN") {
    navItems.push(
      { id: "settings", label: "Clinic Setup & Hours", path: "/vault-clinic/settings", icon: Settings },
      { id: "staff", label: "Staff Management", path: "/vault-clinic/staff", icon: Users },
      { id: "appointments", label: "Appointments", path: "/vault-clinic/appointments", icon: CalendarDays },
      { id: "audit", label: "Audit Trail", path: "/vault-clinic/audit", icon: ScrollText }
    );
  } else if (role === "RECEPTIONIST") {
    navItems.push(
      { id: "appointments", label: "Appointments & Queue", path: "/vault-clinic/appointments", icon: CalendarDays },
      { id: "patients", label: "Patient Directory", path: "/vault-clinic/patients", icon: Users }
    );
  } else if (role === "CLINICIAN") {
    navItems.push(
      { id: "appointments", label: "My Consultation Queue", path: "/vault-clinic/appointments", icon: CalendarDays },
      { id: "patients", label: "Patient Vault Access", path: "/vault-clinic/patients", icon: FolderLock },
      { id: "grants", label: "Active Consent Grants", path: "/vault-clinic/grants", icon: SlidersHorizontal }
    );
  }

  const roleBadgeColor =
    role === "CLINIC_ADMIN"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : role === "CLINICIAN"
      ? "bg-teal-50 text-teal-700 border-teal-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  const roleDisplay =
    role === "CLINIC_ADMIN"
      ? "Clinic Admin"
      : role === "CLINICIAN"
      ? "Clinician"
      : "Receptionist";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 sm:px-5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/medcard-logo.svg" alt="MedCard" className="h-7 w-7 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900">MedCard</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded">
                Vault
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Healthcare Portal</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-md"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Clinic Identity Card */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {staff?.facility?.name || "Clinic Workspace"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-slate-400">{staff?.facility?.code || "---"}</span>
              <span className="inline-block h-1 w-1 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = activeNavId ? activeNavId === item.id : location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 h-9 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? "bg-navy text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              style={isActive ? { backgroundColor: "#003F66", color: "#ffffff" } : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-teal" : "text-slate-400"}`} style={isActive ? { color: "#7FD3E0" } : undefined} />
              <span className="truncate" style={isActive ? { color: "#ffffff" } : undefined}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer: Staff Card & Sign Out */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-900 truncate">{staff?.name || "Clinic Staff"}</p>
            <p className="text-[11px] text-slate-400 truncate">{staff?.email || ""}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Fixed 240px Sidebar */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-slate-200 flex-col fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Below lg) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-60 max-w-[80vw] bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="ml-0 lg:ml-60 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Fixed 56px Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 fixed top-0 right-0 left-0 lg:left-60 z-20 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-md transition-colors"
              aria-label="Open clinic menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate">{pageTitle || "Clinic Workspace"}</h1>
              {pageSubtitle && (
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">{pageSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {actionButton && (
              <button
                type="button"
                onClick={actionButton.onClick}
                className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-lg sm:rounded-xl bg-teal px-2.5 sm:px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-teal/90 transition-colors"
                style={{ backgroundColor: "#00A3B8", color: "#ffffff" }}
              >
                {actionButton.icon}
                <span className="hidden sm:inline" style={{ color: "#ffffff" }}>{actionButton.label}</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Role indicator pill */}
            <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium border ${roleBadgeColor}`}>
              {roleDisplay}
            </span>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 pt-14 p-3.5 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

