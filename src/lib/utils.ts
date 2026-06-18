import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_TIME_ZONE } from "./timezone";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountCents: number, currency = "EUR", locale = "es") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export function formatDate(date: Date | string | null | undefined, locale = "es") {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined, locale = "es") {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function ageFromBirthDate(birth: Date | string | null | undefined): number | null {
  if (!birth) return null;
  const b = typeof birth === "string" ? new Date(birth) : birth;
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function safeJsonParse<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "object") return v as T;
  try {
    return JSON.parse(String(v)) as T;
  } catch {
    return fallback;
  }
}
