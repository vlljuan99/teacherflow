import { describe, it, expect } from "vitest";
import { splitByDate } from "@/server/notebook/parser";

describe("splitByDate — troceado del cuaderno por fechas", () => {
  it("separa secciones encabezadas por una fecha", () => {
    const raw = [
      "15/01/2026",
      "Past simple. Vocabulary: house, kitchen.",
      "22/01/2026",
      "Present perfect. Reading practice.",
    ].join("\n");
    const out = splitByDate(raw);
    expect(out).toHaveLength(2);
    expect(out[0].date.getFullYear()).toBe(2026);
    expect(out[0].date.getMonth()).toBe(0);
    expect(out[0].date.getDate()).toBe(15);
    expect(out[0].text).toContain("Past simple");
    expect(out[1].text).toContain("Present perfect");
  });

  it("acepta separadores '-' y '.' y años de 2 dígitos", () => {
    const raw = ["5-3-26", "Línea A", "06.03.2026", "Línea B"].join("\n");
    const out = splitByDate(raw);
    expect(out).toHaveLength(2);
    expect(out[0].date.getFullYear()).toBe(2026);
    expect(out[0].date.getDate()).toBe(5);
  });

  it("ignora el texto previo a la primera fecha", () => {
    const raw = ["Notas sueltas sin fecha", "10/02/2026", "Contenido real"].join("\n");
    const out = splitByDate(raw);
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe("Contenido real");
  });

  it("descarta secciones de fecha vacías", () => {
    const raw = ["01/01/2026", "   ", "02/01/2026", "Con contenido"].join("\n");
    const out = splitByDate(raw);
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe("Con contenido");
  });

  it("texto sin ninguna fecha devuelve lista vacía", () => {
    expect(splitByDate("solo texto\nsin fechas")).toEqual([]);
  });
});
