import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  X,
  ChevronDown,
  ArrowRightLeft,
} from "lucide-react";
import {
  PATIENT_NAV_GROUPS,
  CLINICAL_NAV_GROUPS,
  ADMIN_NAV_GROUPS,
  type NavGroupConfig,
  type NavItemConfig,
} from "../../config/navigation";

export type Role =
  | "patient"
  | "platform_admin"
  | "Reception"
  | "Doctor"
  | "Nurse"
  | "Laboratory"
  | "Pharmacy"
  | "Cashier";

interface AppSidebarProps {
  currentRole?: Role | string;
  onRoleChange?: (role: Role) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  activeNavId?: string;
  onNavSelect?: (id: string) => void;
  userDisplayName?: string;
  userEmail?: string;
}

export const CURRENT_ROLE_KEY = "medcard_current_role";

export default function AppSidebar({
  currentRole = "Reception",
  onRoleChange,
  isOpenMobile = false,
  onCloseMobile,
  activeNavId,
  onNavSelect,
  userDisplayName,
  userEmail,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const clinicalRoles: Role[] = [
    "Reception",
    "Doctor",
    "Nurse",
    "Laboratory",
    "Pharmacy",
    "Cashier",
  ];

  const isPatient = currentRole === "patient";
  const isPlatformAdmin = currentRole === "platform_admin";

  const navGroups: NavGroupConfig[] = isPlatformAdmin
    ? ADMIN_NAV_GROUPS
    : isPatient
    ? PATIENT_NAV_GROUPS
    : CLINICAL_NAV_GROUPS[currentRole] || CLINICAL_NAV_GROUPS.default;

  const handleRoleSelect = (role: Role) => {
    localStorage.setItem(CURRENT_ROLE_KEY, role);
    if (onRoleChange) {
      onRoleChange(role);
    }
    setRoleDropdownOpen(false);
  };

  const handleItemClick = (item: NavItemConfig) => {
    if (onNavSelect) {
      onNavSelect(item.id);
    }
    if (item.path) {
      navigate(item.path);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    if (isPlatformAdmin) {
      localStorage.removeItem("medcard_admin_token");
      localStorage.removeItem("medcard_admin_data");
      navigate("/admin/login");
    } else if (isPatient) {
      localStorage.removeItem("medcard_auth_token");
      localStorage.removeItem("medcard_user_data");
      localStorage.removeItem("medcard_authenticated");
      navigate("/patient-vault/login");
    } else {
      localStorage.removeItem(CURRENT_ROLE_KEY);
      localStorage.removeItem("medcard_authenticated");
      localStorage.removeItem("medcard_auth_token");
      localStorage.removeItem("medcard_user_data");
      localStorage.removeItem("medcard_current_facility");
      navigate("/login");
    }
  };

  const sidebarContent = (
    <div className="h-dvh flex flex-col w-[248px] bg-white border-r border-[#E4EBF0] select-none">
      {/* 56px Logo Row (shrink-0) */}
      <div className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-[#E4EBF0]">
        <a href="/" className="flex items-center gap-2 outline-none">
          <img
            src="/medcard-logo.svg"
            alt="MedCard"
            className="h-7 w-auto object-contain"
          />
        </a>
        {onCloseMobile && (
          <button
            type="button"
            className="lg:hidden p-1 text-[#7A8D9B] hover:text-[#0F2942] rounded-md transition-colors"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Clinical Role Switcher (Staff Only) */}
      {!isPatient && !isPlatformAdmin && (
        <div className="p-3 border-b border-[#E4EBF0]">
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[#F6F8FA] border border-[#E4EBF0] hover:bg-[#F0F4F8] transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-[#00A3B8]/15 text-[#00A3B8] font-semibold text-xs flex items-center justify-center shrink-0">
                {String(currentRole).charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-medium text-[#7A8D9B] truncate leading-tight">
                  Role
                </span>
                <span className="block text-xs font-semibold text-[#0F2942] truncate leading-tight">
                  {currentRole}
                </span>
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-[#7A8D9B] transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {roleDropdownOpen && (
            <div className="mt-2 p-1.5 rounded-lg bg-white border border-[#E4EBF0] shadow-sm space-y-0.5">
              <div className="px-2 py-1 text-[11px] font-medium text-[#7A8D9B] flex items-center gap-1.5">
                <ArrowRightLeft size={11} />
                <span>Switch role</span>
              </div>
              {clinicalRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                    currentRole === r
                      ? "bg-[#F0F4F8] text-[#0F2942] font-semibold"
                      : "text-[#475B6B] hover:bg-[#F6F8FA]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation List (Scrollable flex-1) */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.groupLabel && (
              <div className="px-2.5 py-1 text-[11px] font-medium text-[#7A8D9B]">
                {group.groupLabel}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNavId
                  ? activeNavId === item.id
                  : window.location.pathname === item.path;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full h-9 px-2.5 rounded-lg flex items-center justify-between text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-[#F0F4F8] text-[#0F2942] font-semibold"
                        : "text-[#475B6B] hover:bg-[#F6F8FA] hover:text-[#0F2942]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={16}
                        className={isActive ? "text-[#00A3B8]" : "text-[#7A8D9B]"}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-[#00A3B8]/15 text-[#00A3B8]"
                            : "bg-[#F0F4F8] text-[#7A8D9B]"
                        } ${item.badgeClass || ""}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 56px Account & Logout Row (shrink-0) */}
      <div className="h-14 shrink-0 px-3 border-t border-[#E4EBF0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-full bg-[#F0F4F8] border border-[#E4EBF0] text-[#0F2942] font-semibold text-xs flex items-center justify-center shrink-0">
            {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : "M"}
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-[#0F2942] truncate leading-tight">
              {userDisplayName || (isPlatformAdmin ? "Platform Admin" : isPatient ? "Patient Vault" : "Clinical Staff")}
            </span>
            <span className="block text-[11px] text-[#7A8D9B] truncate leading-tight">
              {userEmail || (isPlatformAdmin ? "MedCard platform" : isPatient ? "Personal account" : "Clinic portal")}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="p-1.5 text-[#7A8D9B] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Aside */}
      <aside className="hidden lg:block h-dvh shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Below lg) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F2942]/40 transition-opacity backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-dvh">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
