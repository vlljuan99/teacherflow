"use client";

import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
  differenceInMinutes,
} from "date-fns";
import { Video, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { paletteFor, fmtDuration, type CalendarEvent } from "./helpers";
import { useCalendarActions } from "./use-calendar-actions";
import { useState } from "react";

export function MonthView({
  month,
  events,
}: {
  month: Date;
  events: CalendarEvent[];
}) {
  const { confirmDeleteId, handleDelete, cancelDelete, handleMove } = useCalendarActions();
  const [dragTarget, setDragTarget] = useState<string | null>(null);

  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
      {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
        <div key={d} className="bg-muted/40 px-2 py-1 font-medium uppercase">
          {d}
        </div>
      ))}
      {days.map((day) => {
        const dayKey = day.toISOString();
        const dayEvents = events
          .filter((e) => isSameDay(e.startAt, day))
          .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
        const isDragOver = dragTarget === dayKey;
        return (
          <div
            key={dayKey}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragTarget !== dayKey) setDragTarget(dayKey);
            }}
            onDragLeave={() => {
              if (dragTarget === dayKey) setDragTarget(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragTarget(null);
              const classId = e.dataTransfer.getData("text/plain");
              if (classId) handleMove(classId, day.toISOString());
            }}
            className={cn(
              "relative min-h-[120px] bg-card p-1 align-top transition",
              !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground",
              isDragOver && "ring-2 ring-inset ring-primary bg-primary/5",
            )}
          >
            <div className="mb-1 text-right text-[11px]">{format(day, "d")}</div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((e) => (
                <MonthEvent
                  key={e.id}
                  event={e}
                  isConfirming={confirmDeleteId === e.id}
                  onDelete={handleDelete}
                  onCancel={cancelDelete}
                />
              ))}
              {dayEvents.length > 3 && (
                <p className="text-[11px] text-muted-foreground">
                  +{dayEvents.length - 3}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthEvent({
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
  const duration = differenceInMinutes(e.endAt, e.startAt);
  const studentName = e.studentLabel ?? e.title;

  if (isConfirming) {
    return (
      <div className="relative overflow-hidden rounded-md bg-destructive text-destructive-foreground">
        <div className="flex items-stretch text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onDelete(e.id)}
            className="flex-1 px-2 py-1.5 text-left hover:bg-destructive/80"
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
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData("text/plain", e.id);
        ev.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group relative overflow-hidden rounded-md text-[11px] leading-tight transition hover:shadow-sm",
        palette.bg,
        palette.text,
      )}
      title={`${format(e.startAt, "HH:mm")}–${format(e.endAt, "HH:mm")} · ${studentName}${
        e.title && e.title !== studentName ? ` · ${e.title}` : ""
      }`}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", palette.bar)} />
      <Link
        href={e.href ?? "#"}
        className="block cursor-grab pl-2.5 pr-2 py-1.5 active:cursor-grabbing"
      >
        <div className="flex items-center gap-1 text-[10px] opacity-80">
          <span className="font-semibold">{format(e.startAt, "HH:mm")}</span>
          <span>·</span>
          <span>{fmtDuration(duration)}</span>
          {e.hasMeet && <Video className="ml-auto h-3 w-3 shrink-0" />}
        </div>
        <div className="truncate font-semibold">{studentName}</div>
      </Link>
      <div className="absolute right-1 top-1 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
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
