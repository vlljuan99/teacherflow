"use client";

import { Fragment } from "react";
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
  Headset,
  ScrollText,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  // Section header (nav labelKey) shown before the first item of each group.
  section?: string;
  // Only visible to ADMIN users (filtered in the layout before render).
  adminOnly?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard, section: "sectionGeneral" },
  { href: "/search", labelKey: "search", icon: Sparkles, section: "sectionGeneral" },
  { href: "/logs", labelKey: "logs", icon: ScrollText, section: "sectionGeneral", adminOnly: true },

  { href: "/students", labelKey: "students", icon: Users, section: "sectionStudents" },
  { href: "/groups", labelKey: "groups", icon: Boxes, section: "sectionStudents" },
  { href: "/attendance", labelKey: "attendance", icon: ClipboardCheck, section: "sectionStudents" },

  { href: "/classes", labelKey: "classes", icon: CalendarDays, section: "sectionTeaching" },
  { href: "/materials", labelKey: "materials", icon: FolderOpen, section: "sectionTeaching" },
  { href: "/worksheets", labelKey: "worksheets", icon: FileText, section: "sectionTeaching" },
  { href: "/assignments", labelKey: "assignments", icon: ClipboardList, section: "sectionTeaching" },
  { href: "/submissions", labelKey: "submissions", icon: Mic, section: "sectionTeaching" },

  { href: "/profile", labelKey: "myProfile", icon: UserCog, section: "sectionConfig" },
  { href: "/payments", labelKey: "payments", icon: CreditCard, section: "sectionConfig" },
  { href: "/settings/expression", labelKey: "expression", icon: Sparkles, section: "sectionConfig" },
  { href: "/settings/speaking", labelKey: "speaking", icon: MessageSquare, section: "sectionConfig" },
  { href: "/settings/reminders", labelKey: "reminders", icon: Mail, section: "sectionConfig" },
];

export const STUDENT_NAV: NavItem[] = [
  { href: "/portal/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/portal/classes", labelKey: "myClasses", icon: CalendarDays },
  { href: "/portal/worksheets", labelKey: "myWorksheets", icon: FileText },
  { href: "/portal/materials", labelKey: "myMaterials", icon: FolderOpen },
  { href: "/portal/speaking", labelKey: "speaking", icon: MessageSquare },
  { href: "/portal/writing", labelKey: "myWriting", icon: PenLine },
  { href: "/portal/progress", labelKey: "myProgress", icon: TrendingUp },
  { href: "/portal/teacher", labelKey: "contactTeacher", icon: Headset },
];

export function Sidebar({
  items,
  badges,
  isAdmin = false,
}: {
  items: NavItem[];
  badges?: Record<string, number>;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  // adminOnly items are hidden from non-admins.
  const visibleItems = items.filter((item) => isAdmin || !item.adminOnly);
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card/70 backdrop-blur-xl md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <OdysseyLogo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item, i) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/portal/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          const badge = badges?.[item.href] ?? 0;
          const showHeader =
            item.section && item.section !== visibleItems[i - 1]?.section;
          return (
            <Fragment key={item.href}>
              {showHeader && (
                <div
                  className={cn(
                    "px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70",
                    i === 0 ? "pt-1" : "pt-4",
                  )}
                >
                  {t(item.section!)}
                </div>
              )}
              <Link
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
            </Fragment>
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
