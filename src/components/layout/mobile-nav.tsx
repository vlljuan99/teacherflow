"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "./sidebar";

// How many destinations live directly on the bar before we overflow into "More".
// Anything beyond this would make the labels collide on a phone-width screen.
const MAX_PRIMARY = 4;

export function MobileNav({
  items,
  badges,
}: {
  items: NavItem[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [moreOpen, setMoreOpen] = useState(false);

  const overflow = items.length > MAX_PRIMARY + 1;
  const primary = overflow ? items.slice(0, MAX_PRIMARY) : items;
  const extra = overflow ? items.slice(MAX_PRIMARY) : [];

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/portal/dashboard" &&
      href !== "/dashboard" &&
      pathname.startsWith(href));

  const extraActive = extra.some((item) => isActive(item.href));
  const extraBadge = extra.reduce((sum, item) => sum + (badges?.[item.href] ?? 0), 0);
  const columns = primary.length + (overflow ? 1 : 0);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div
          className="fixed inset-x-0 z-50 rounded-t-3xl border-t bg-card p-4 shadow-2xl md:hidden"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 0px)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">{t("more")}</span>
            <button
              type="button"
              aria-label={t("less")}
              onClick={() => setMoreOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {extra.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const badge = badges?.[item.href] ?? 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl p-2 text-[11px] font-medium leading-tight transition",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-full",
                      active ? "bg-primary/10" : "bg-secondary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {badge > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                        {badge}
                      </span>
                    )}
                  </span>
                  <span className="w-full truncate text-center">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul
          className="grid"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {primary.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const badge = badges?.[item.href] ?? 0;
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
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
                  <span className="w-full truncate text-center">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}

          {overflow && (
            <li className="min-w-0">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className={cn(
                  "flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium leading-tight transition",
                  moreOpen || extraActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    (moreOpen || extraActive) && "bg-primary/10",
                  )}
                >
                  <MoreHorizontal className="h-5 w-5" />
                  {extraBadge > 0 && !moreOpen && (
                    <span className="absolute right-1.5 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {extraBadge}
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center">{t("more")}</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
