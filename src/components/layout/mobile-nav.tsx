"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { NavItem } from "./sidebar";

export function MobileNav({
  items,
  badges,
}: {
  items: NavItem[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/portal/dashboard" &&
              item.href !== "/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          const badge = badges?.[item.href] ?? 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium leading-tight transition",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {badge > 0 && (
                    <span className="absolute right-1.5 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
