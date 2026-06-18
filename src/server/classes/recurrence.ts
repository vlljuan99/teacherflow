import { addDays } from "date-fns";

// Internal convention: ISO weekdays 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RecurrenceParams {
  weekdays: IsoWeekday[];
  untilDate: Date;
}

/**
 * Given a startAt (with time-of-day), generate all matching dates between
 * `startAt`'s day and `untilDate` (inclusive) whose ISO weekday is in `weekdays`.
 * Time-of-day is preserved across all instances.
 */
export function generateRecurrenceDates(
  startAt: Date,
  params: RecurrenceParams,
): Date[] {
  if (params.weekdays.length === 0) return [startAt];
  const startHour = startAt.getHours();
  const startMin = startAt.getMinutes();
  const out: Date[] = [];

  let cursor = new Date(startAt);
  cursor.setHours(0, 0, 0, 0);

  const end = new Date(params.untilDate);
  end.setHours(23, 59, 59, 999);

  // Safety cap: 18 months ahead from start. Avoids runaway dates.
  const safetyCap = new Date(startAt);
  safetyCap.setMonth(safetyCap.getMonth() + 18);
  const hardEnd = end > safetyCap ? safetyCap : end;

  while (cursor <= hardEnd) {
    // JS Date.getDay() returns 0=Sun..6=Sat. Convert to ISO 1=Mon..7=Sun.
    const jsDow = cursor.getDay();
    const isoDow = (jsDow === 0 ? 7 : jsDow) as IsoWeekday;
    if (params.weekdays.includes(isoDow)) {
      const d = new Date(cursor);
      d.setHours(startHour, startMin, 0, 0);
      out.push(d);
    }
    cursor = addDays(cursor, 1);
  }
  return out;
}

const ISO_LABELS_SINGULAR: Record<IsoWeekday, string> = {
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábado",
  7: "domingo",
};

const ISO_LABELS_PLURAL: Record<IsoWeekday, string> = {
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábados",
  7: "domingos",
};

export function describeRecurrence(
  weekdays: IsoWeekday[],
  untilDate?: Date,
): string {
  if (weekdays.length === 0) return "";
  const sorted = [...weekdays].sort((a, b) => a - b);
  const labels = sorted.map((d) => ISO_LABELS_PLURAL[d]);
  let days: string;
  if (labels.length === 1) days = `los ${labels[0]}`;
  else {
    const last = labels.pop()!;
    days = `los ${labels.join(", ")} y ${last}`;
  }
  const untilStr = untilDate
    ? ` hasta el ${untilDate.toLocaleDateString("es-ES")}`
    : "";
  return `Cada semana ${days}${untilStr}`;
}

export const ISO_WEEKDAY_LABELS = ISO_LABELS_SINGULAR;
