import { describe, it, expect } from "vitest";
import {
  generateRecurrenceDates,
  describeRecurrence,
  type IsoWeekday,
} from "@/server/classes/recurrence";

describe("generateRecurrenceDates", () => {
  // 2026-06-29 es lunes.
  const monday = new Date(2026, 5, 29, 18, 30, 0, 0);

  it("sin días seleccionados devuelve solo la fecha inicial", () => {
    expect(generateRecurrenceDates(monday, { weekdays: [], untilDate: new Date(2026, 6, 30) }))
      .toEqual([monday]);
  });

  it("genera lun+mié durante dos semanas conservando la hora", () => {
    const out = generateRecurrenceDates(monday, {
      weekdays: [1, 3] as IsoWeekday[],
      untilDate: new Date(2026, 6, 9), // jueves 9 jul
    });
    // lun 29 jun, mié 1 jul, lun 6 jul, mié 8 jul
    expect(out).toHaveLength(4);
    for (const d of out) {
      expect(d.getHours()).toBe(18);
      expect(d.getMinutes()).toBe(30);
    }
    const iso = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    expect(out.map(iso)).toEqual(["2026-6-29", "2026-7-1", "2026-7-6", "2026-7-8"]);
  });

  it("incluye la fecha inicial cuando su día está seleccionado", () => {
    const out = generateRecurrenceDates(monday, {
      weekdays: [1] as IsoWeekday[],
      untilDate: monday,
    });
    expect(out).toHaveLength(1);
    expect(out[0].getDate()).toBe(29);
  });

  it("aplica el tope de seguridad de 18 meses", () => {
    const out = generateRecurrenceDates(monday, {
      weekdays: [1] as IsoWeekday[],
      untilDate: new Date(2035, 0, 1), // muy lejano
    });
    const last = out[out.length - 1];
    const cap = new Date(monday);
    cap.setMonth(cap.getMonth() + 18);
    expect(last.getTime()).toBeLessThanOrEqual(cap.getTime());
  });

  it("domingo se trata como ISO 7, no como 0", () => {
    const sunday = new Date(2026, 6, 5, 10, 0); // 5 jul 2026 es domingo
    const out = generateRecurrenceDates(sunday, {
      weekdays: [7] as IsoWeekday[],
      untilDate: new Date(2026, 6, 6),
    });
    expect(out).toHaveLength(1);
    expect(out[0].getDate()).toBe(5);
  });
});

describe("describeRecurrence", () => {
  it("un solo día", () => {
    expect(describeRecurrence([1] as IsoWeekday[])).toBe("Cada semana los lunes");
  });
  it("varios días en orden con 'y' final", () => {
    expect(describeRecurrence([3, 1] as IsoWeekday[]))
      .toBe("Cada semana los lunes y miércoles");
  });
  it("tres días", () => {
    expect(describeRecurrence([1, 3, 5] as IsoWeekday[]))
      .toBe("Cada semana los lunes, miércoles y viernes");
  });
  it("añade 'hasta' cuando hay fecha límite", () => {
    const out = describeRecurrence([1] as IsoWeekday[], new Date(2026, 6, 30));
    expect(out).toContain("Cada semana los lunes hasta el");
  });
  it("sin días devuelve cadena vacía", () => {
    expect(describeRecurrence([] as IsoWeekday[])).toBe("");
  });
});
