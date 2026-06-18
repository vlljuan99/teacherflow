"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DateTimeRangePicker } from "@/components/ui/datetime-range";
import { Avatar } from "@/components/ui/avatar";
import { MeetButton } from "@/components/ui/meet-button";
import { ClassModality } from "@/lib/enums";
import { Video, Users2, Sparkles, Loader2, Repeat } from "lucide-react";
import { addWeeks } from "date-fns";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export interface ClassFormStudent {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  meetLink: string | null;
  level: string;
}

export interface ClassFormGroup {
  id: string;
  name: string;
}

export interface ClassFormAttachable {
  id: string;
  title: string;
  type: "worksheet" | "material";
}

export interface ClassFormInitial {
  id?: string;
  title?: string | null;
  titleAuto?: boolean | null;
  startAt?: Date | null;
  endAt?: Date | null;
  modality?: string | null;
  location?: string | null;
  notes?: string | null;
  studentId?: string | null;
  groupId?: string | null;
  attachmentIds?: { worksheetIds: string[]; materialIds: string[] };
}

export function ClassForm({
  action,
  students,
  groups,
  worksheets,
  materials,
  klass,
}: {
  action: (formData: FormData) => Promise<void>;
  students: ClassFormStudent[];
  groups: ClassFormGroup[];
  worksheets: ClassFormAttachable[];
  materials: ClassFormAttachable[];
  klass?: ClassFormInitial | null;
}) {
  const t = useTranslations("classes");
  const tCommon = useTranslations("common");

  const [studentId, setStudentId] = useState(klass?.studentId ?? "");
  const [groupId, setGroupId] = useState(klass?.groupId ?? "");
  const [modality, setModality] = useState<string>(
    klass?.modality ?? ClassModality.ONLINE,
  );
  const [titleEdited, setTitleEdited] = useState(
    klass?.titleAuto === false || (Boolean(klass?.title) && klass?.titleAuto == null),
  );
  const [title, setTitle] = useState(klass?.title ?? "");
  const [startAt, setStartAt] = useState<Date>(klass?.startAt ?? defaultStart());
  const [selectedWorksheets, setSelectedWorksheets] = useState<Set<string>>(
    new Set(klass?.attachmentIds?.worksheetIds ?? []),
  );
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(
    new Set(klass?.attachmentIds?.materialIds ?? []),
  );
  const [attachQuery, setAttachQuery] = useState("");

  // --- Recurrence (only when creating)
  const isNew = !klass?.id;
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set());
  const [untilDate, setUntilDate] = useState<string>(
    formatDateInput(addWeeks(new Date(), 8)),
  );

  const student = useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [studentId, students],
  );
  const group = useMemo(
    () => groups.find((g) => g.id === groupId) ?? null,
    [groupId, groups],
  );

  const autoTitle = useMemo(() => {
    const dateLabel = format(startAt, "EEEE d 'de' MMMM", { locale: es });
    if (student) return `${student.firstName} — ${dateLabel}`;
    if (group) return `${group.name} — ${dateLabel}`;
    return `Clase — ${dateLabel}`;
  }, [student, group, startAt]);

  const effectiveTitle = titleEdited ? title : autoTitle;

  const onPickerChange = useCallback((s: Date) => {
    setStartAt(s);
  }, []);

  const isOnline = modality === ClassModality.ONLINE;
  const meetLink = student?.meetLink ?? null;

  const filteredWorksheets = worksheets.filter((w) =>
    w.title.toLowerCase().includes(attachQuery.toLowerCase()),
  );
  const filteredMaterials = materials.filter((m) =>
    m.title.toLowerCase().includes(attachQuery.toLowerCase()),
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="title" value={effectiveTitle} />
      <input type="hidden" name="titleAuto" value={titleEdited ? "false" : "true"} />
      {[...selectedWorksheets].map((id) => (
        <input key={id} type="hidden" name="worksheetIds" value={id} />
      ))}
      {[...selectedMaterials].map((id) => (
        <input key={id} type="hidden" name="materialIds" value={id} />
      ))}

      {/* Step 1 — Student / Group */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          1. ¿Para quién?
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="studentId" className="text-xs">{t("student")}</Label>
            <Select
              id="studentId"
              name="studentId"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                if (e.target.value) setGroupId("");
              }}
            >
              <option value="">— Selecciona alumno —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} · {s.level}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="groupId" className="text-xs">{t("group")}</Label>
            <Select
              id="groupId"
              name="groupId"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                if (e.target.value) setStudentId("");
              }}
            >
              <option value="">— Selecciona grupo —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {student && (
          <div className="mt-2 flex items-center gap-3 rounded-lg border bg-card/50 p-3">
            <Avatar
              src={student.photoUrl}
              name={`${student.firstName} ${student.lastName}`}
              size="md"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-xs text-muted-foreground">Nivel {student.level}</p>
            </div>
            {meetLink && isOnline ? (
              <MeetButton href={meetLink} label="Su sala" size="sm" />
            ) : !meetLink && isOnline ? (
              <span className="text-xs text-amber-600">
                Sin enlace fijo de Meet en su ficha
              </span>
            ) : null}
          </div>
        )}
      </section>

      {/* Step 2 — Modality */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          2. ¿Cómo?
        </h3>
        <input type="hidden" name="modality" value={modality} />
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: ClassModality.ONLINE, label: "Online", icon: Video },
              { value: ClassModality.IN_PERSON, label: "Presencial", icon: Users2 },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon;
            const active = modality === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setModality(opt.value)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition",
                  active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent bg-muted hover:border-accent/30",
                )}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
        {modality === ClassModality.IN_PERSON && (
          <div>
            <Label htmlFor="location" className="text-xs">{t("location")}</Label>
            <Input id="location" name="location" defaultValue={klass?.location ?? ""} />
          </div>
        )}
      </section>

      {/* Step 3 — When */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          3. ¿Cuándo?
        </h3>
        <DateTimeRangePicker
          defaultStart={klass?.startAt ?? startAt}
          defaultEnd={klass?.endAt ?? undefined}
          onChange={onPickerChange}
        />
      </section>

      {/* Step 4 — Title (auto) */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          4. Título
        </h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              {titleEdited ? "Editado manualmente" : "Generado automáticamente"}
            </span>
            {titleEdited && (
              <button
                type="button"
                onClick={() => {
                  setTitleEdited(false);
                  setTitle("");
                }}
                className="text-xs text-primary hover:underline"
              >
                Restaurar
              </button>
            )}
          </div>
          <Input
            value={effectiveTitle}
            onChange={(e) => {
              setTitleEdited(true);
              setTitle(e.target.value);
            }}
            placeholder={autoTitle || "Selecciona un alumno o grupo"}
          />
        </div>
      </section>

      {/* Step 5 — Attachments */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          5. Fichas y materiales (opcional)
        </h3>
        <Input
          placeholder="Buscar fichas o materiales por nombre…"
          value={attachQuery}
          onChange={(e) => setAttachQuery(e.target.value)}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <AttachList
            title="Fichas"
            items={filteredWorksheets}
            selected={selectedWorksheets}
            onToggle={(id) =>
              setSelectedWorksheets((prev) => toggleSet(prev, id))
            }
          />
          <AttachList
            title="Materiales"
            items={filteredMaterials}
            selected={selectedMaterials}
            onToggle={(id) => setSelectedMaterials((prev) => toggleSet(prev, id))}
          />
        </div>
      </section>

      {/* Step 6 — Recurrence (only on create) */}
      {isNew && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            6. ¿Repetir?
          </h3>
          <label className="flex items-center gap-2 rounded-lg border bg-card p-3 cursor-pointer hover:border-primary/40">
            <input
              type="checkbox"
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Repeat className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Repetir esta clase semanalmente
            </span>
          </label>

          {repeat && (
            <>
              <input type="hidden" name="repeat" value="true" />
              <input
                type="hidden"
                name="weekdays"
                value={[...weekdays].sort().join(",")}
              />
              <input type="hidden" name="untilDate" value={untilDate} />
              <div className="rounded-lg border bg-card/50 p-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Días de la semana</label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[
                      { v: 1, l: "L" },
                      { v: 2, l: "M" },
                      { v: 3, l: "X" },
                      { v: 4, l: "J" },
                      { v: 5, l: "V" },
                      { v: 6, l: "S" },
                      { v: 7, l: "D" },
                    ].map((d) => {
                      const active = weekdays.has(d.v);
                      return (
                        <button
                          key={d.v}
                          type="button"
                          onClick={() =>
                            setWeekdays((prev) => {
                              const next = new Set(prev);
                              if (next.has(d.v)) next.delete(d.v);
                              else next.add(d.v);
                              return next;
                            })
                          }
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "hover:border-primary/40 hover:bg-accent/10",
                          )}
                        >
                          {d.l}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                  <Input
                    type="date"
                    value={untilDate}
                    onChange={(e) => setUntilDate(e.target.value)}
                    className="mt-1.5 w-48"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {weekdays.size === 0
                    ? "Elige al menos un día"
                    : `Se crearán aproximadamente ${estimateOccurrences(startAt, [...weekdays], untilDate)} clases.`}
                </p>
              </div>
            </>
          )}
        </section>
      )}

      <section className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs">{t("notes")}</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={klass?.notes ?? ""} />
      </section>

      <div className="flex items-center justify-end gap-2">
        <SubmitButton label={tCommon("save")} />
      </div>
    </form>
  );
}

function formatDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function estimateOccurrences(
  startAt: Date,
  weekdays: number[],
  untilDateStr: string,
): number {
  if (weekdays.length === 0) return 0;
  const until = new Date(untilDateStr);
  if (isNaN(until.getTime()) || until < startAt) return 0;
  let cur = new Date(startAt);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(until);
  end.setHours(23, 59, 59, 999);
  let n = 0;
  while (cur <= end) {
    const dow = cur.getDay() === 0 ? 7 : cur.getDay();
    if (weekdays.includes(dow)) n += 1;
    cur.setDate(cur.getDate() + 1);
    if (n > 200) break;
  }
  return n;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Guardando…" : label}
    </Button>
  );
}

function AttachList({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: ClassFormAttachable[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
        {title} ({selected.size}/{items.length})
      </div>
      <ul className="max-h-48 overflow-y-auto p-1">
        {items.length === 0 && (
          <li className="px-2 py-3 text-center text-xs text-muted-foreground">
            Nada por aquí
          </li>
        )}
        {items.map((item) => {
          const checked = selected.has(item.id);
          return (
            <li key={item.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/10",
                  checked && "bg-primary/5",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="truncate">{item.title}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function toggleSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function defaultStart(): Date {
  const d = new Date();
  d.setHours(17, 0, 0, 0);
  return d;
}
