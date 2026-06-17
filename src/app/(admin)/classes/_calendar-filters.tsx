"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  addDays,
  addMonths,
  startOfMonth,
  startOfWeek,
  format,
  subDays,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { MonthView } from "@/components/calendar/month-view";
import { TimeGridView } from "@/components/calendar/time-grid-view";
import { paletteFor, type CalendarEvent } from "@/components/calendar/helpers";
import { useCalendarActions } from "@/components/calendar/use-calendar-actions";
import { cn } from "@/lib/utils";

interface FilterableEvent extends CalendarEvent {
  studentId: string | null;
  groupId: string | null;
}

type View = "month" | "week" | "day";

export function CalendarWithFilters({
  anchor,
  view,
  events,
  students,
  groups,
}: {
  anchor: Date;
  view: View;
  events: FilterableEvent[];
  students: { id: string; firstName: string; lastName: string }[];
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { pending, refresh } = useCalendarActions();

  const [studentId, setStudentId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [modality, setModality] = useState("");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (studentId && e.studentId !== studentId) return false;
      if (groupId && e.groupId !== groupId) return false;
      if (modality && e.modality !== modality) return false;
      return true;
    });
  }, [events, studentId, groupId, modality]);

  const hasFilter = studentId || groupId || modality;

  const legend = useMemo(() => {
    const map = new Map<string, { label: string; palette: ReturnType<typeof paletteFor> }>();
    for (const e of filtered) {
      if (!e.studentSeed) continue;
      if (!map.has(e.studentSeed)) {
        map.set(e.studentSeed, {
          label: e.studentLabel ?? "—",
          palette: paletteFor(e.studentSeed),
        });
      }
    }
    return [...map.values()].slice(0, 10);
  }, [filtered]);

  function buildUrl(overrides: { view?: View; date?: Date }) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    if (overrides.view) params.set("view", overrides.view);
    if (overrides.date) params.set("d", format(overrides.date, "yyyy-MM-dd"));
    return `${pathname}?${params.toString()}`;
  }

  function navTo(date: Date) {
    router.push(buildUrl({ date }));
  }
  function setView(v: View) {
    router.push(buildUrl({ view: v }));
  }

  function prev() {
    if (view === "month") navTo(subMonths(anchor, 1));
    else if (view === "week") navTo(subDays(anchor, 7));
    else navTo(subDays(anchor, 1));
  }
  function next() {
    if (view === "month") navTo(addMonths(anchor, 1));
    else if (view === "week") navTo(addDays(anchor, 7));
    else navTo(addDays(anchor, 1));
  }
  function goToday() {
    navTo(new Date());
  }

  const headerLabel = useMemo(() => {
    if (view === "month") return format(anchor, "MMMM yyyy", { locale: es });
    if (view === "week") {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      return `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`;
    }
    return format(anchor, "EEEE d 'de' MMMM yyyy", { locale: es });
  }, [view, anchor]);

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-end gap-3 p-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filtros
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Alumno</label>
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="min-w-[160px]">
            <option value="">Todos</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Grupo</label>
          <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="min-w-[140px]">
            <option value="">Todos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Modalidad</label>
          <Select value={modality} onChange={(e) => setModality(e.target.value)} className="min-w-[120px]">
            <option value="">Todas</option>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">Presencial</option>
          </Select>
        </div>
        {hasFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStudentId("");
              setGroupId("");
              setModality("");
            }}
          >
            <X className="h-4 w-4" /> Limpiar
          </Button>
        )}
        {legend.length > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {legend.map((l, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span className={`inline-block h-2 w-2 rounded-full ${l.palette.bar}`} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent/10"
            title="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm hover:bg-accent/10"
          >
            <CalendarDays className="mr-1 h-4 w-4" />
            Hoy
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent/10"
            title="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent/10 disabled:opacity-50"
            title="Actualizar"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>

        <h2 className="text-lg font-semibold capitalize">{headerLabel}</h2>

        <div className="inline-flex rounded-md border bg-card p-0.5">
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition",
                view === v
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <MonthView month={anchor} events={filtered} />
      ) : view === "week" ? (
        <TimeGridView anchor={anchor} daysCount={7} events={filtered} />
      ) : (
        <TimeGridView anchor={anchor} daysCount={1} events={filtered} />
      )}

      <p className="text-xs text-muted-foreground">
        💡 Arrastra una clase para moverla — en vista <strong>Mes</strong> cambia el día, en
        vista <strong>Semana</strong> o <strong>Día</strong> cambia día y hora (snap cada 15 min). Pasa
        el ratón por encima de cualquier clase para abrir Meet, editar o eliminar.
      </p>
    </div>
  );
}
