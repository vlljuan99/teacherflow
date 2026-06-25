import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "destructive" | "muted" | "info";

const tones: Record<Tone, string> = {
  default: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  destructive: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  muted: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15",
  info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
