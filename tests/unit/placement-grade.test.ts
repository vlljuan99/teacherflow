import { describe, it, expect } from "vitest";
import {
  autoGradeSection,
  computeFinalScore,
  scoreToCefr,
} from "@/server/placement-test/grade";
import type { Question } from "@/server/placement-test/content";

const q = (id: string, correct: string): Question => ({
  id,
  prompt: "?",
  choices: [],
  correct,
});

describe("autoGradeSection", () => {
  const questions = [q("1", "a"), q("2", "b"), q("3", "c"), q("4", "d")];

  it("todas correctas -> 10/10", () => {
    expect(autoGradeSection(questions, ["a", "b", "c", "d"]))
      .toEqual({ correct: 4, total: 4, score10: 10 });
  });

  it("la mitad correctas -> 5/10", () => {
    const r = autoGradeSection(questions, ["a", "b", "x", "x"]);
    expect(r.correct).toBe(2);
    expect(r.score10).toBeCloseTo(5);
  });

  it("respuestas nulas (sin contestar) cuentan como fallo", () => {
    const r = autoGradeSection(questions, [null, null, "c", null]);
    expect(r.correct).toBe(1);
    expect(r.score10).toBeCloseTo(2.5);
  });
});

describe("computeFinalScore", () => {
  it("media de las cuatro partes redondeada a 1 decimal", () => {
    expect(computeFinalScore({ grammar: 8, reading: 7, writing: 6, speaking: 5 }))
      .toBe(6.5);
  });

  it("redondea correctamente (7+8+8+8)/4 = 7.75 -> 7.8", () => {
    expect(computeFinalScore({ grammar: 7, reading: 8, writing: 8, speaking: 8 }))
      .toBe(7.8);
  });

  it("devuelve null si falta alguna parte", () => {
    expect(computeFinalScore({ grammar: 8, reading: 7, writing: null, speaking: 5 }))
      .toBeNull();
  });
});

describe("scoreToCefr — calibración de niveles", () => {
  const cases: Array<[number, string]> = [
    [0, "A1"],
    [1.9, "A1"],
    [2, "A2"],
    [3.9, "A2"],
    [4, "B1"],
    [5.9, "B1"],
    [6, "B2"],
    [7.4, "B2"],
    [7.5, "C1"],
    [8.9, "C1"],
    [9, "C2"],
    [10, "C2"],
  ];
  it.each(cases)("score %s -> %s", (score, level) => {
    expect(scoreToCefr(score)).toBe(level);
  });
});
