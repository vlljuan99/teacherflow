"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  startOfWeek,
  addDays,
  isSameDay,
  format,
  differenceInMinutes,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { Video, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { paletteFor, fmtDuration, type CalendarEvent } from "./helpers";
import { useCalendarActions } from "./use-calendar-actions";

const START_HOUR = 8;
const END_HOUR = 22;
const HOUR_HEIGHT = 56; // px per hour
const SNAP_MINUTES = 15;

export function TimeGridView({
  anchor,
  daysCount,
  events,
}: {
  anchor: Date;
  daysCount: 1 | 7;
  events: CalendarEvent[];
}) {
  const { confirmDeleteId, handleDelete, cancelDelete, handleMove } = useCalendarActions();
  const start = daysCount === 7 ? startOfWeek(anchor, { weekStartsOn: 1 }) : anchor;
  const days: Date[] = [];
  for (let i = 0; i < daysCount; i++) days.push(addDays(start, i));

  const hours: number[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) hours.push(h);
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  const [dropPreview, setDropPreview] = useState<{ dayIso: string; minutesFromStart: number } | null>(null);

  function computeMinutesFromY(y: number): number {
    const minutes = (y / HOUR_HEIGHT) * 60;
    const snapped = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
    const max = (END_HOUR - START_HOUR) * 60 - SNAP_MINUTES;
    return Math.max(0, Math.min(max, snapped));
  }

  function onColumnDragOver(e: React.DragEvent<HTMLDivElement>, day: Date) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const minutesFromStart = computeMinutesFromY(e.clientY - rect.top);
    setDropPreview({ dayIso: day.toISOString(), minutesFromStart });
  }

  function onColumnDrop(e: React.DragEvent<HTMLDivElement>, day: Date) {
    e.preventDefault();
    const classId = e.dataTransfer.getData("text/plain");
    setDropPreview(null);
    if (!classId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minutesFromStart = computeMinutesFromY(e.clientY - rect.top);
    const newStart = new Date(day);
    const hours = Math.floor(minutesFromStart / 60) + START_HOUR;
    const minutes = minutesFromStart % 60;
    newStart.setHours(hours, minutes, 0, 0);
    handleMove(classId, newStart.toISOString(), false);
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `48px repeat(${daysCount}, minmax(0, 1fr))`,
        }}
      >
        <div className="border-b border-r bg-muted/30" />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={cn(
              "border-b border-r px-2 py-2 text-center text-xs",
              isToday(d) && "bg-primary/5",
            )}
          >
            <div className="text-muted-foreground uppercase">
              {format(d, "EEE", { locale: es })}
            </div>
            <div
              className={cn(
                "mt-0.5 text-base font-semibold",
                isToday(d) && "text-primary",
              )}
            >
              {format(d, "d")}
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `48px repeat(${daysCount}, minmax(0, 1fr))`,
          }}
        >
          <div className="border-r">
            {hours.map((h) => (
              <div
                key={h}
                className="relative border-b text-[10px] text-muted-foreground"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-1.5 right-1">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>
          {days.map((d) => {
            const dayIso = d.toISOString();
            const previewActive = dropPreview?.dayIso === dayIso;
            return (
              <div
                key={dayIso}
                onDragOver={(e) => onColumnDragOver(e, d)}
                onDragLeave={() => {
                  setDropPreview((curr) => (curr?.dayIso === dayIso ? null : curr));
                }}
                onDrop={(e) => onColumnDrop(e, d)}
                className={cn(
                  "relative border-r transition",
                  isToday(d) && "bg-primary/[0.03]",
                  previewActive && "bg-primary/[0.06]",
                )}
                style={{ height: totalHeight }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="border-b border-dashed border-border/60"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {previewActive && dropPreview && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-30 flex items-center justify-center"
                    style={{
                      top: (dropPreview.minutesFromStart / 60) * HOUR_HEIGHT,
                    }}
                  >
                    <div className="h-0.5 w-full bg-primary" />
                    <span className="absolute -top-2 right-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                      {String(
                        Math.floor(dropPreview.minutesFromStart / 60) + START_HOUR,
                      ).padStart(2, "0")}
                      :
                      {String(dropPreview.minutesFromStart % 60).padStart(2, "0")}
                    </span>
                  </div>
                )}
                {events
                  .filter((e) => isSameDay(e.startAt, d))
                  .map((e) => (
                    <TimeEvent
                      key={e.id}
                      event={e}
                      isConfirming={confirmDeleteId === e.id}
                      onDelete={handleDelete}
                      onCancel={cancelDelete}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimeEvent({
  event: e,
  isConfirming,
  onDelete,
  onCancel,
}: {
  event: CalendarEvent;
  isConfirming: boolean;
  onDelete: (id: string) => void;
  onCancel: () => void;
}) {
  const palette = paletteFor(e.studentSeed);
  const startHours = e.startAt.getHours() + e.startAt.getMinutes() / 60;
  const top = (startHours - START_HOUR) * HOUR_HEIGHT;
  const duration = differenceInMinutes(e.endAt, e.startAt);
  const height = Math.max(28, (duration / 60) * HOUR_HEIGHT - 2);
  const studentName = e.studentLabel ?? e.title;
  const ref = useRef<HTMLDivElement>(null);

  if (top < 0 || top >= (END_HOUR - START_HOUR) * HOUR_HEIGHT) return null;

  if (isConfirming) {
    return (
      <div
        className="absolute left-1 right-1 z-20 overflow-hidden rounded-md bg-destructive text-destructive-foreground shadow"
        style={{ top, height }}
      >
        <div className="flex h-full items-stretch text-xs font-semibold">
          <button
            type="button"
            onClick={() => onDelete(e.id)}
            className="flex-1 px-2 text-left hover:bg-destructive/80"
          >
            <Trash2 className="mr-1 inline h-3.5 w-3.5" />
            Confirmar eliminar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border-l border-destructive-foreground/30 px-2 hover:bg-destructive/80"
            title="Cancelar"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData("text/plain", e.id);
        ev.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group absolute left-1 right-1 z-10 overflow-hidden rounded-md text-[11px] leading-tight shadow-sm transition hover:shadow-md cursor-grab active:cursor-grabbing",
        palette.bg,
        palette.text,
      )}
      style={{ top, height }}
      title={`${format(e.startAt, "HH:mm")}–${format(e.endAt, "HH:mm")} · ${studentName} · ${e.title}`}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", palette.bar)} />
      <Link href={e.href ?? "#"} className="block h-full pl-2.5 pr-2 py-1.5">
        <div className="flex items-center gap-1 text-[10px] opacity-80">
          <span className="font-semibold">{format(e.startAt, "HH:mm")}</span>
          <span>·</span>
          <span>{fmtDuration(duration)}</span>
          {e.hasMeet && <Video className="ml-auto h-3 w-3 shrink-0" />}
        </div>
        <div className="truncate font-semibold">{studentName}</div>
        {height > 44 && e.title && e.title !== studentName && (
          <div className="mt-0.5 truncate text-[10px] opacity-70">
            {e.title}
          </div>
        )}
      </Link>
      <div className="absolute right-1 top-1 z-20 flex gap-1 opacity-0 transition group-hover:opacity-100">
        {e.meetLink && (
          <a
            href={e.meetLink}
            target="_blank"
            rel="noreferrer"
            onClick={(ev) => ev.stopPropagation()}
            className="flex h-6 items-center justify-center gap-1 rounded-md bg-meet px-1.5 text-[10px] font-bold text-meet-foreground shadow-sm ring-1 ring-meet/40 hover:brightness-110"
            title={`Abrir Meet — ${e.meetLink}`}
          >
            <Video className="h-3 w-3" fill="currentColor" strokeWidth={0} />
            Meet
          </a>
        )}
        <Link
          href={e.href ?? "#"}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/10 hover:bg-primary hover:text-primary-foreground"
          onClick={(ev) => ev.stopPropagation()}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onDelete(e.id);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/10 hover:bg-destructive hover:text-destructive-foreground"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
