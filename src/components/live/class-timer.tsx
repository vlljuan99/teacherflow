"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClassTimer({ startAt, endAt }: { startAt: Date; endAt: Date }) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const total = end - start;
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let phase: "before" | "active" | "warning" | "over" = "before";
  let label = "";
  let progress = 0;
  if (now < start) {
    phase = "before";
    const sec = Math.round((start - now) / 1000);
    label = `Empieza en ${formatHMS(sec)}`;
  } else if (now > end) {
    phase = "over";
    const sec = Math.round((now - end) / 1000);
    label = `Terminada hace ${formatHMS(sec)}`;
    progress = 100;
  } else {
    const remaining = end - now;
    const remainingSec = Math.round(remaining / 1000);
    label = `Quedan ${formatHMS(remainingSec)}`;
    progress = ((now - start) / total) * 100;
    phase = remaining < 5 * 60 * 1000 ? "warning" : "active";
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition",
        phase === "warning" && "border-warning bg-warning/5",
        phase === "over" && "border-muted bg-muted/30",
        phase === "before" && "border-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock
            className={cn(
              "h-4 w-4",
              phase === "warning" && "text-warning",
              phase === "active" && "text-primary",
              phase === "over" && "text-muted-foreground",
            )}
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmtClock(start)} – {fmtClock(end)}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            phase === "warning" ? "bg-warning" : phase === "over" ? "bg-muted-foreground/40" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

function formatHMS(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function fmtClock(t: number): string {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
