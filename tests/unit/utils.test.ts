import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatMoney,
  ageFromBirthDate,
  slugify,
  safeJsonParse,
} from "@/lib/utils";

describe("formatMoney", () => {
  it("convierte céntimos a euros con formato es-ES", () => {
    // El separador puede variar según ICU, así que comprobamos las partes.
    const out = formatMoney(1234); // 12,34 €
    expect(out).toMatch(/12/);
    expect(out).toMatch(/34/);
    expect(out).toMatch(/€/);
  });

  it("cero céntimos", () => {
    expect(formatMoney(0)).toMatch(/0/);
  });
});

describe("ageFromBirthDate", () => {
  afterEach(() => vi.useRealTimers());

  it("calcula la edad ya cumplida este año", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 29)); // 29 jun 2026
    expect(ageFromBirthDate(new Date(2000, 0, 1))).toBe(26);
  });

  it("resta un año si el cumpleaños aún no ha llegado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 29));
    expect(ageFromBirthDate(new Date(2000, 11, 31))).toBe(25);
  });

  it("devuelve null sin fecha", () => {
    expect(ageFromBirthDate(null)).toBeNull();
    expect(ageFromBirthDate(undefined)).toBeNull();
  });
});

describe("slugify", () => {
  it("normaliza acentos y espacios", () => {
    expect(slugify("Canción de María")).toBe("cancion-de-maria");
  });
  it("recorta guiones sobrantes", () => {
    expect(slugify("  ¡Hola!  ")).toBe("hola");
  });
});

describe("safeJsonParse", () => {
  it("parsea JSON válido", () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });
  it("devuelve el fallback ante JSON inválido", () => {
    expect(safeJsonParse("no-json", { ok: true })).toEqual({ ok: true });
  });
  it("devuelve el fallback ante null/undefined", () => {
    expect(safeJsonParse(null, [])).toEqual([]);
    expect(safeJsonParse(undefined, "x")).toBe("x");
  });
  it("devuelve el objeto tal cual si ya es objeto", () => {
    const obj = { a: 1 };
    expect(safeJsonParse(obj, {})).toBe(obj);
  });
});
