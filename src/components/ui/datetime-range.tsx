"use client";

import { useState, useMemo, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format, addMinutes } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

function toLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pickDateTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const TIME_SLOTS: { h: number; m: number }[] = (() => {
  const out: { h: number; m: number }[] = [];
  for (let h = 8; h <= 21; h++) {
    out.push({ h, m: 0 });
    out.push({ h, m: 30 });
  }
  return out;
})();

const DURATION_PRESETS = [30, 45, 60, 75, 90, 120];

export function DateTimeRangePicker({
  defaultStart,
  defaultEnd,
  nameStart = "startAt",
  nameEnd = "endAt",
  onChange,
}: {
  defaultStart?: Date | null;
  defaultEnd?: Date | null;
  nameStart?: string;
  nameEnd?: string;
  onChange?: (start: Date, end: Date) => void;
}) {
  const initial = defaultStart ?? roundToNextSlot(new Date());
  const initialEnd = defaultEnd ?? addMinutes(initial, 60);

  const [date, setDate] = useState<Date>(initial);
  const [hour, setHour] = useState<number>(initial.getHours());
  const [minute, setMinute] = useState<number>(initial.getMinutes());
  const [duration, setDuration] = useState<number>(
    Math.max(15, Math.round((initialEnd.getTime() - initial.getTime()) / 60000)),
  );
  const [customTime, setCustomTime] = useState(false);

  const start = useMemo(() => pickDateTime(date, hour, minute), [date, hour, minute]);
  const end = useMemo(() => addMinutes(start, duration), [start, duration]);

  useEffect(() => {
    onChange?.(start, end);
  }, [start, end, onChange]);

  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr]">
      <input type="hidden" name={nameStart} value={toLocal(start)} />
      <input type="hidden" name={nameEnd} value={toLocal(end)} />

      <div className="rounded-lg border bg-card p-2 shadow-sm">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={(d) => d && setDate(d)}
          locale={es}
          weekStartsOn={1}
          className="rdp-tf"
          modifiersClassNames={{
            selected: "!bg-primary !text-primary-foreground",
            today: "!font-bold !text-accent",
          }}
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Hora de inicio
          </label>
          {!customTime ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto">
              {TIME_SLOTS.map((s) => {
                const active = s.h === hour && s.m === minute;
                return (
                  <button
                    key={`${s.h}-${s.m}`}
                    type="button"
                    onClick={() => {
                      setHour(s.h);
                      setMinute(s.m);
                    }}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-accent/10 hover:border-accent",
                    )}
                  >
                    {String(s.h).padStart(2, "0")}:{String(s.m).padStart(2, "0")}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCustomTime(true)}
                className="rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground hover:bg-accent/10"
              >
                Otra…
              </button>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="time"
                value={`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  if (!isNaN(h) && !isNaN(m)) {
                    setHour(h);
                    setMinute(m);
                  }
                }}
                className="h-9 rounded-md border px-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setCustomTime(false)}
                className="text-xs text-muted-foreground hover:underline"
              >
                Volver a slots
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Duración</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((d) => {
              const active = d === duration;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-accent/10 hover:border-accent",
                  )}
                >
                  {d < 60 ? `${d} min` : d === 60 ? "1 h" : `${d / 60} h`}
                </button>
              );
            })}
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 60)}
              className="h-7 w-16 rounded-md border px-2 text-xs"
            />
            <span className="text-xs text-muted-foreground self-center">min</span>
          </div>
        </div>

        <div className="rounded-md border bg-primary/5 px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span className="font-medium">{format(start, "EEEE d 'de' MMMM", { locale: es })}</span>
          </div>
          <div className="mt-0.5 text-muted-foreground">
            {format(start, "HH:mm")} – {format(end, "HH:mm")} · {duration} min
          </div>
        </div>
      </div>
    </div>
  );
}

function roundToNextSlot(d: Date): Date {
  const next = new Date(d);
  const m = next.getMinutes();
  if (m === 0 || m === 30) {
    next.setMinutes(m, 0, 0);
  } else if (m < 30) {
    next.setMinutes(30, 0, 0);
  } else {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  }
  return next;
}
