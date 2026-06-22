"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Boxes,
  CalendarDays,
  FileText,
  ClipboardList,
  CreditCard,
  ShieldCheck,
  FolderOpen,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/students", labelKey: "students", icon: Users },
  { href: "/groups", labelKey: "groups", icon: Boxes },
  { href: "/classes", labelKey: "classes", icon: CalendarDays },
  { href: "/search", labelKey: "search", icon: Sparkles },
  { href: "/worksheets", labelKey: "worksheets", icon: FileText },
  { href: "/assignments", labelKey: "assignments", icon: ClipboardList },
  { href: "/payments", labelKey: "payments", icon: CreditCard },
  { href: "/materials", labelKey: "materials", icon: FolderOpen },
  { href: "/settings/expression", labelKey: "settings", icon: Settings },
];

export const STUDENT_NAV: NavItem[] = [
  { href: "/portal/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/portal/classes", labelKey: "myClasses", icon: CalendarDays },
  { href: "/portal/worksheets", labelKey: "myWorksheets", icon: FileText },
  { href: "/portal/materials", labelKey: "myMaterials", icon: FolderOpen },
  { href: "/portal/progress", labelKey: "myProgress", icon: TrendingUp },
];

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card/70 backdrop-blur md:flex md:flex-col">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-sm">
          <GraduationCap className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold tracking-tight">TeacherFlow</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/portal/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition hover:bg-accent/10 hover:text-foreground",
                active && "bg-gradient-to-r from-primary/15 to-accent/10 text-primary shadow-sm",
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
