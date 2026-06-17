export interface CalendarEvent {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  href?: string;
  modality?: "ONLINE" | "IN_PERSON";
  studentSeed?: string;
  studentLabel?: string;
  meetLink?: string | null;
  hasMeet?: boolean;
}

export const STUDENT_PALETTES = [
  { bg: "bg-violet-100", text: "text-violet-900", bar: "bg-violet-500", solid: "bg-violet-500" },
  { bg: "bg-sky-100", text: "text-sky-900", bar: "bg-sky-500", solid: "bg-sky-500" },
  { bg: "bg-emerald-100", text: "text-emerald-900", bar: "bg-emerald-500", solid: "bg-emerald-500" },
  { bg: "bg-amber-100", text: "text-amber-900", bar: "bg-amber-500", solid: "bg-amber-500" },
  { bg: "bg-rose-100", text: "text-rose-900", bar: "bg-rose-500", solid: "bg-rose-500" },
  { bg: "bg-cyan-100", text: "text-cyan-900", bar: "bg-cyan-500", solid: "bg-cyan-500" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-900", bar: "bg-fuchsia-500", solid: "bg-fuchsia-500" },
  { bg: "bg-lime-100", text: "text-lime-900", bar: "bg-lime-500", solid: "bg-lime-500" },
  { bg: "bg-orange-100", text: "text-orange-900", bar: "bg-orange-500", solid: "bg-orange-500" },
  { bg: "bg-indigo-100", text: "text-indigo-900", bar: "bg-indigo-500", solid: "bg-indigo-500" },
] as const;

export const DEFAULT_PALETTE = {
  bg: "bg-slate-100",
  text: "text-slate-900",
  bar: "bg-slate-400",
  solid: "bg-slate-400",
} as const;

export function paletteFor(seed?: string) {
  if (!seed) return DEFAULT_PALETTE;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  return STUDENT_PALETTES[Math.abs(hash) % STUDENT_PALETTES.length];
}

export function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  if (mins % 60 === 0) return `${mins / 60}h`;
  return `${Math.floor(mins / 60)}h${mins % 60}`;
}

export function firstNameOf(label?: string): string {
  if (!label) return "—";
  return label.split(" ")[0] ?? label;
}
