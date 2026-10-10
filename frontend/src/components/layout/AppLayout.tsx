import { useState, useEffect, type ReactNode } from "react";
import AppSidebar, {
  type Role,
  CURRENT_ROLE_KEY,
} from "./AppSidebar";
import AppTopbar from "./AppTopbar";

interface ActiveProfileOption {
  id: string;
  name: string;
  isDependent: boolean;
}

interface AppLayoutProps {
  children: ReactNode;
  currentRole?: Role | string;
  pageTitle?: string;
  pageSubtitle?: string;
  activeNavId?: string;
  onNavSelect?: (id: string) => void;
  userDisplayName?: string;
  userEmail?: string;
  // Patient Portal specific
  profiles?: ActiveProfileOption[];
  selectedProfileId?: string;
  onSelectProfileId?: (id: string) => void;
  onBookAppointmentClick?: () => void;
  onNotificationsClick?: () => void;
  hasUnreadNotifications?: boolean;
  // Action buttons
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
  customTopbarLeft?: ReactNode;
  customTopbarRight?: ReactNode;
}

export default function AppLayout({
  children,
  currentRole: initialRole,
  pageTitle = "Dashboard",
  pageSubtitle,
  activeNavId,
  onNavSelect,
  userDisplayName,
  userEmail,
  profiles,
  selectedProfileId,
  onSelectProfileId,
  onBookAppointmentClick,
  onNotificationsClick,
  hasUnreadNotifications,
  actionButton,
  secondaryActionButton,
  customTopbarLeft,
  customTopbarRight,
}: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [role, setRole] = useState<Role | string>(() => {
    if (initialRole) return initialRole;
    const storedRole = localStorage.getItem(CURRENT_ROLE_KEY);
    if (
      storedRole === "Reception" ||
      storedRole === "Doctor" ||
      storedRole === "Nurse" ||
      storedRole === "Laboratory" ||
      storedRole === "Pharmacy" ||
      storedRole === "Cashier" ||
      storedRole === "patient"
    ) {
      return storedRole;
    }
    return "Reception";
  });

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      return;
    }
    const syncRole = () => {
      const stored = localStorage.getItem(CURRENT_ROLE_KEY);
      if (stored && stored !== role) {
        setRole(stored as Role);
      }
    };
    window.addEventListener("storage", syncRole);
    return () => window.removeEventListener("storage", syncRole);
  }, [initialRole, role]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
  };

  return (
    <div className="h-dvh overflow-hidden grid lg:grid-cols-[248px_1fr] bg-[#F6F8FA]">
      <AppSidebar
        currentRole={role}
        onRoleChange={handleRoleChange}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        activeNavId={activeNavId}
        onNavSelect={onNavSelect}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
      />

      <div className="flex min-h-0 min-w-0 flex-col">
        <AppTopbar
          currentRole={role}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onToggleMobileMenu={() => setMobileSidebarOpen(true)}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelectProfileId={onSelectProfileId}
          onBookAppointmentClick={onBookAppointmentClick}
          onNotificationsClick={onNotificationsClick}
          hasUnreadNotifications={hasUnreadNotifications}
          actionButton={actionButton}
          secondaryActionButton={secondaryActionButton}
          leftContent={customTopbarLeft}
          rightContent={customTopbarRight}
        />

        <main className="flex-1 min-h-0 overflow-y-auto bg-[#F6F8FA]">
          {children}
        </main>
      </div>
    </div>
  );
}