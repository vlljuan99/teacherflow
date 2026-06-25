"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { OdysseyLogo } from "@/components/brand/odyssey-logo";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Boxes,
  CalendarDays,
  FileText,
  ClipboardList,
  ClipboardCheck,
  CreditCard,
  ShieldCheck,
  FolderOpen,
  Compass,
  TrendingUp,
  Sparkles,
  Settings,
  Mail,
  MessageSquare,
  Mic,
  PenLine,
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
  { href: "/attendance", labelKey: "attendance", icon: ClipboardCheck },
  { href: "/search", labelKey: "search", icon: Sparkles },
  { href: "/worksheets", labelKey: "worksheets", icon: FileText },
  { href: "/assignments", labelKey: "assignments", icon: ClipboardList },
  { href: "/submissions", labelKey: "submissions", icon: Mic },
  { href: "/payments", labelKey: "payments", icon: CreditCard },
  { href: "/materials", labelKey: "materials", icon: FolderOpen },
  { href: "/settings/expression", labelKey: "expression", icon: Sparkles },
  { href: "/settings/reminders", labelKey: "reminders", icon: Mail },
  { href: "/settings/speaking", labelKey: "speaking", icon: MessageSquare },
];

export const STUDENT_NAV: NavItem[] = [
  { href: "/portal/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/portal/classes", labelKey: "myClasses", icon: CalendarDays },
  { href: "/portal/worksheets", labelKey: "myWorksheets", icon: FileText },
  { href: "/portal/materials", labelKey: "myMaterials", icon: FolderOpen },
  { href: "/portal/speaking", labelKey: "speaking", icon: MessageSquare },
  { href: "/portal/writing", labelKey: "myWriting", icon: PenLine },
  { href: "/portal/progress", labelKey: "myProgress", icon: TrendingUp },
];

export function Sidebar({
  items,
  badges,
}: {
  items: NavItem[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card/70 backdrop-blur-xl md:flex md:flex-col">
      <div className="border-b px-5 py-4">
        <OdysseyLogo />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/portal/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          const badge = badges?.[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground/70 transition-all hover:bg-secondary hover:text-foreground",
                active &&
                  "bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/15 hover:bg-primary/10 hover:text-primary",
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              <span className="flex-1">{t(item.labelKey)}</span>
              {badge > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.06] p-4">
          <Compass className="absolute -bottom-3 -right-3 h-16 w-16 text-primary/10" />
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-4 w-4" />
            <span className="text-sm font-semibold">{tBrand("journeyTitle")}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {tBrand("journeySubtitle")}
          </p>
        </div>
      </div>
    </aside>
  );
}
