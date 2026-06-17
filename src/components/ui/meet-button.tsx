"use client";

import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md";

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

const iconSizes: Record<Size, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

export function MeetButton({
  href,
  size = "sm",
  label = "Meet",
  className,
}: {
  href: string;
  size?: Size;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-meet-foreground",
        "bg-gradient-to-r from-meet to-emerald-500 shadow-md shadow-meet/30",
        "ring-1 ring-meet/40 hover:shadow-lg hover:shadow-meet/40 hover:-translate-y-0.5",
        "transition-all duration-150 active:translate-y-0",
        sizes[size],
        className,
      )}
    >
      <Video className={iconSizes[size]} fill="currentColor" strokeWidth={0} />
      {label}
    </a>
  );
}
