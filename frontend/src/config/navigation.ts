import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Wifi,
  CalendarDays,
  FileText,
  FlaskConical,
  Pill,
  CreditCard,
  HeartPulse,
  Stethoscope,
  UsersRound,
  UserRound,
  Bell,
} from "lucide-react";

export interface NavItemConfig {
  id: string;
  label: string;
  path?: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeClass?: string;
}

export interface NavGroupConfig {
  groupLabel?: string;
  items: NavItemConfig[];
}

export const PATIENT_NAV_GROUPS: NavGroupConfig[] = [
  {
    groupLabel: "Main",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "appointments", label: "Appointments", icon: CalendarDays },
      { id: "history", label: "Medical history", icon: HeartPulse },
      { id: "consultations", label: "Consultations", icon: Stethoscope },
      { id: "prescriptions", label: "Prescriptions and results", icon: Pill },
      { id: "documents", label: "Documents and insurance", icon: FileText },
      { id: "notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    groupLabel: "Account",
    items: [
      { id: "family", label: "Family profiles", icon: UsersRound },
      { id: "profile", label: "Profile", icon: UserRound },
      { id: "billing", label: "Plan and billing", icon: CreditCard },
    ],
  },
];

export const CLINICAL_NAV_GROUPS: Record<string, NavGroupConfig[]> = {
  default: [
    {
      groupLabel: "Workspace",
      items: [
        { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { id: "patients", label: "Patients", path: "/patients", icon: Users, badge: "12 Today" },
        { id: "nfc-scan", label: "NFC Scanner", path: "/nfc/scan", icon: Wifi, badge: "Live", badgeClass: "animate-pulse" },
        { id: "appointments", label: "Appointments", path: "/appointments", icon: CalendarDays, badge: "8 Queue" },
        { id: "medical-records", label: "Medical Records", path: "/medical-records", icon: FileText },
      ],
    },
    {
      groupLabel: "Services",
      items: [
        { id: "laboratory", label: "Laboratory", path: "/laboratory", icon: FlaskConical, badge: "4 Pending" },
        { id: "pharmacy", label: "Pharmacy", path: "/pharmacy", icon: Pill },
        { id: "payment", label: "Payments", path: "/payment", icon: CreditCard },
      ],
    },
  ],
};

