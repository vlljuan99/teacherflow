import { describe, it, expect } from "vitest";
import { buildAutoTitle } from "@/server/classes/title";

describe("buildAutoTitle", () => {
  const startAt = new Date(2026, 5, 29, 18, 30); // lunes 29 de junio

  it("prioriza el nombre del alumno", () => {
    const t = buildAutoTitle({ studentName: "María", groupName: "Grupo A2", startAt });
    expect(t.startsWith("María — ")).toBe(true);
    expect(t).toContain("junio");
  });

  it("usa el grupo si no hay alumno", () => {
    const t = buildAutoTitle({ studentName: null, groupName: "Grupo A2", startAt });
    expect(t.startsWith("Grupo A2 — ")).toBe(true);
  });

  it("usa 'Clase' como fallback", () => {
    const t = buildAutoTitle({ startAt });
    expect(t.startsWith("Clase — ")).toBe(true);
  });

  it("formatea la fecha en español", () => {
    const t = buildAutoTitle({ startAt });
    expect(t).toMatch(/lunes 29 de junio/);
  });
});
