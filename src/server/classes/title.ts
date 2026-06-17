import { format } from "date-fns";
import { es } from "date-fns/locale";

export function buildAutoTitle(opts: {
  studentName?: string | null;
  groupName?: string | null;
  startAt: Date;
}): string {
  const dateLabel = format(opts.startAt, "EEEE d 'de' MMMM", { locale: es });
  if (opts.studentName) return `${opts.studentName} — ${dateLabel}`;
  if (opts.groupName) return `${opts.groupName} — ${dateLabel}`;
  return `Clase — ${dateLabel}`;
}
