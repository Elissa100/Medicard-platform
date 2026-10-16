import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  selector?: ReactNode;
}

export function PageHeader({ title, description, action, selector }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-2">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-[20px] font-semibold text-[#0F2942] tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-xs sm:text-[13px] text-[#7A8D9B] mt-0.5 leading-snug">{description}</p>}
      </div>
      {(selector || action) && (
        <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          {selector}
          {action}
        </div>
      )}
    </div>
  );
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  headerClassName = "",
}: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-[#E4EBF0] p-3.5 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between gap-2.5 mb-3.5 sm:mb-4 flex-wrap sm:flex-nowrap ${headerClassName}`}>
          <div className="min-w-0">
            {title && <h2 className="text-[14px] sm:text-[15px] font-semibold text-[#0F2942] leading-tight">{title}</h2>}
            {subtitle && <p className="text-[11px] sm:text-[12px] text-[#7A8D9B] mt-0.5 leading-snug">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export interface StatItem {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
}

export interface StatStripProps {
  stats: StatItem[];
  className?: string;
}

export function StatStrip({ stats, className = "" }: StatStripProps) {
  return (
    <div className={`bg-white rounded-xl border border-[#E4EBF0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4EBF0] ${className}`}>
      {stats.map((stat, i) => (
        <div key={i} className="p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
          <div className="text-[12px] sm:text-[13px] font-medium text-[#7A8D9B]">{stat.label}</div>
          <div className="mt-1.5 sm:mt-2 text-[20px] sm:text-[22px] font-semibold text-[#0F2942] tracking-tight leading-none truncate">
            {stat.value}
          </div>
          {stat.subtext && (
            <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-[12px] text-[#475B6B] truncate">{stat.subtext}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export interface DefinitionItem {
  label: string;
  value: ReactNode;
  action?: ReactNode;
}

export interface DefinitionListProps {
  items: DefinitionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}

export function DefinitionList({ items, columns = 3, className = "" }: DefinitionListProps) {
  const colClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-3";

  return (
    <div className={`grid ${colClass} gap-3 sm:gap-4 ${className}`}>
      {items.map((item, i) => (
        <div key={i} className="space-y-1 min-w-0">
          <span className="text-[11px] sm:text-[12px] text-[#7A8D9B] block font-medium">{item.label}</span>
          <div className="text-[13px] sm:text-[14px] font-medium text-[#0F2942] flex items-center justify-between gap-2">
            <span className="break-words min-w-0">{item.value}</span>
            {item.action}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface StatusBadgeProps {
  status: string;
  variant?: "green" | "amber" | "red" | "blue" | "gray";
  className?: string;
}

export function StatusBadge({ status, variant = "gray", className = "" }: StatusBadgeProps) {
  const colorMap = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    amber: "bg-amber-50 text-amber-800 border-amber-200/60",
    red: "bg-rose-50 text-rose-800 border-rose-200/60",
    blue: "bg-blue-50 text-blue-800 border-blue-200/60",
    gray: "bg-slate-100 text-slate-700 border-slate-200/60",
  };

  return (
    <span
      className={`inline-flex items-center h-[22px] px-2 rounded text-[12px] font-medium border ${colorMap[variant]} ${className}`}
    >
      {status}
    </span>
  );
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, hint, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`py-4 text-center flex flex-col items-center justify-center max-h-[118px] ${className}`}>
      <Icon size={20} className="text-[#7A8D9B] mb-1.5 shrink-0" />
      <p className="text-[14px] font-medium text-[#0F2942] leading-tight">{title}</p>
      <p className="text-[12px] text-[#7A8D9B] mt-0.5 leading-tight">{hint}</p>
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}

export interface DataTableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function DataTable({ headers, children, className = "" }: DataTableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-[#E4EBF0] ${className}`}>
      <table className="w-full text-left text-[14px] text-[#475B6B]">
        <thead className="border-b border-[#E4EBF0] bg-[#F6F8FA] text-[12px] font-medium text-[#7A8D9B]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3.5 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E4EBF0] bg-white">{children}</tbody>
      </table>
    </div>
  );
}

