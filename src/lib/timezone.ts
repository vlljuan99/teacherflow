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
