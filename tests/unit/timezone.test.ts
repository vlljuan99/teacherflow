import { describe, it, expect } from "vitest";
import {
  parseMadridDateTime,
  madridDayBounds,
  inMadrid,
  APP_TIME_ZONE,
} from "@/lib/timezone";

describe("zona horaria de la app", () => {
  it("usa Europe/Madrid", () => {
    expect(APP_TIME_ZONE).toBe("Europe/Madrid");
  });

  it("parseMadridDateTime interpreta el valor como hora peninsular (verano = UTC+2)", () => {
    // En julio España va en CEST (UTC+2). 18:30 local -> 16:30 UTC.
    const d = parseMadridDateTime("2026-07-15T18:30");
    expect(d.toISOString()).toBe("2026-07-15T16:30:00.000Z");
  });

  it("parseMadridDateTime en invierno (CET = UTC+1)", () => {
    // En enero España va en CET (UTC+1). 09:00 local -> 08:00 UTC.
    const d = parseMadridDateTime("2026-01-15T09:00");
    expect(d.toISOString()).toBe("2026-01-15T08:00:00.000Z");
  });

  it("madridDayBounds cubre el día natural completo en hora local", () => {
    // Instante UTC dentro del 15 jul (verano, UTC+2).
    const { start, end } = madridDayBounds(new Date("2026-07-15T12:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-07-14T22:00:00.000Z"); // 00:00 local
    expect(end.toISOString()).toBe("2026-07-15T21:59:59.999Z"); // 23:59:59.999 local
  });

  it("inMadrid desplaza los campos locales al huso español", () => {
    const d = inMadrid("2026-07-15T16:30:00.000Z"); // 18:30 en Madrid
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(30);
  });
});
