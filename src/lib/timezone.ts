import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const APP_TIME_ZONE = "Europe/Madrid";

/** Interprets a timezone-less form value as Spanish local time. */
export function parseMadridDateTime(value: string): Date {
  return fromZonedTime(value, APP_TIME_ZONE);
}

/** Converts an instant so date-fns local-field helpers operate in Spanish time. */
export function inMadrid(date: Date | string): Date {
  return toZonedTime(typeof date === "string" ? new Date(date) : date, APP_TIME_ZONE);
}

export function madridDayBounds(date: Date = new Date()): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = `${read("year")}-${read("month")}-${read("day")}`;
  return {
    start: fromZonedTime(`${day}T00:00:00.000`, APP_TIME_ZONE),
    end: fromZonedTime(`${day}T23:59:59.999`, APP_TIME_ZONE),
  };
}
