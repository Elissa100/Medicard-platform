import {
  Menu,
  Bell,
  CalendarPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Role } from "./AppSidebar";

interface ActiveProfileOption {
  id: string;
  name: string;
  isDependent: boolean;
}

interface AppTopbarProps {
  currentRole?: Role | string;
  pageTitle?: string;
  pageSubtitle?: string;
  onToggleMobileMenu?: () => void;
  // Patient Portal specific props
  profiles?: ActiveProfileOption[];
  selectedProfileId?: string;
  onSelectProfileId?: (id: string) => void;
  onBookAppointmentClick?: () => void;
  onNotificationsClick?: () => void;
  hasUnreadNotifications?: boolean;
  // Clinical / Custom action buttons
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryActionButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export default function AppTopbar({
  currentRole = "Reception",
  pageTitle = "Dashboard",
  pageSubtitle,
  onToggleMobileMenu,
  profiles,
  selectedProfileId,
  onSelectProfileId,
  onBookAppointmentClick,
  onNotificationsClick,
  hasUnreadNotifications = false,
  actionButton,
  secondaryActionButton,
  leftContent,
  rightContent,
}: AppTopbarProps) {
  const isPatient = currentRole === "patient";

  const selectedProfile = profiles?.find((p) => p.id === selectedProfileId);
  const isViewingDependent = selectedProfile?.isDependent ?? false;

  return (
    <header className="h-14 shrink-0 border-b border-[#E4EBF0] bg-white px-4 sm:px-6 flex items-center justify-between z-20">
      {/* Left Area */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 -ml-1 text-[#475B6B] hover:text-[#0F2942] rounded-md transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        {leftContent ? (
          leftContent
        ) : isPatient && profiles && profiles.length > 0 ? (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#7A8D9B] hidden sm:inline">
                Active record:
              </span>
              <select
                value={selectedProfileId}
                onChange={(e) => onSelectProfileId?.(e.target.value)}
                className="h-8 text-xs font-medium text-[#0F2942] bg-[#F6F8FA] border border-[#E4EBF0] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#00A3B8]"
                aria-label="Select active record"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDependent ? "(Dependent)" : "(Me)"}
                  </option>
                ))}
              </select>
            </div>

            {isViewingDependent && selectedProfile && (
              <span className="h-[22px] px-2.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center">
                Viewing: {selectedProfile.name}, dependent
              </span>
            )}
          </div>
        ) : (
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-[#0F2942] truncate leading-tight">
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="text-[11px] text-[#7A8D9B] truncate leading-tight">
                {pageSubtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right Area */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {rightContent ? (
          rightContent
        ) : isPatient ? (
          <>
            {onBookAppointmentClick && (
              <button
                type="button"
                onClick={onBookAppointmentClick}
                className="h-8 sm:h-9 px-3 sm:px-3.5 bg-[#0F2942] hover:bg-[#183a5c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <CalendarPlus size={15} />
                <span className="hidden xs:inline">Book an appointment</span>
                <span className="xs:hidden">Book</span>
              </button>
            )}

            {onNotificationsClick && (
              <button
                type="button"
                onClick={onNotificationsClick}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-[#475B6B] hover:text-[#0F2942] hover:bg-[#F6F8FA] rounded-lg transition-colors relative"
                aria-label="View notifications"
              >
                <Bell size={17} />
                {hasUnreadNotifications && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#00A3B8] rounded-full" />
                )}
              </button>
            )}
          </>
        ) : (
          <>
            {secondaryActionButton && (
              <button
                type="button"
                onClick={secondaryActionButton.onClick}
                className="h-8 sm:h-9 px-3 text-xs font-medium text-[#475B6B] bg-[#F6F8FA] hover:bg-[#E4EBF0] rounded-lg transition-colors flex items-center gap-1.5"
              >
                {secondaryActionButton.icon}
                <span>{secondaryActionButton.label}</span>
              </button>
            )}

            {actionButton && (
              <button
                type="button"
                onClick={actionButton.onClick}
                className="h-8 sm:h-9 px-3.5 bg-[#0F2942] hover:bg-[#183a5c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {actionButton.icon}
                <span>{actionButton.label}</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
