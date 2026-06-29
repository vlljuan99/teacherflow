import { describe, it, expect } from "vitest";
import { gradeAnswer } from "@/server/grading/auto-grade";
import { ExerciseType } from "@/lib/enums";

describe("gradeAnswer — autocorrección de ejercicios", () => {
  describe("MULTIPLE_CHOICE", () => {
    const sol = { correct: [1, 3] };
    it("acierto con el mismo conjunto en cualquier orden", () => {
      expect(gradeAnswer(ExerciseType.MULTIPLE_CHOICE, {}, sol, { selected: [3, 1] }, 2))
        .toEqual({ autoCorrect: true, autoScore: 2 });
    });
    it("fallo si falta una opción", () => {
      expect(gradeAnswer(ExerciseType.MULTIPLE_CHOICE, {}, sol, { selected: [1] }, 2))
        .toEqual({ autoCorrect: false, autoScore: 0 });
    });
    it("fallo si sobra una opción", () => {
      expect(gradeAnswer(ExerciseType.MULTIPLE_CHOICE, {}, sol, { selected: [1, 2, 3] }, 2))
        .toEqual({ autoCorrect: false, autoScore: 0 });
    });
    it("respuesta vacía cuenta como fallo", () => {
      expect(gradeAnswer(ExerciseType.MULTIPLE_CHOICE, {}, sol, undefined, 2))
        .toEqual({ autoCorrect: false, autoScore: 0 });
    });
  });

  describe("TRUE_FALSE", () => {
    it("acierto", () => {
      expect(gradeAnswer(ExerciseType.TRUE_FALSE, {}, { value: true }, { value: true }, 1))
        .toEqual({ autoCorrect: true, autoScore: 1 });
    });
    it("fallo", () => {
      expect(gradeAnswer(ExerciseType.TRUE_FALSE, {}, { value: true }, { value: false }, 1))
        .toEqual({ autoCorrect: false, autoScore: 0 });
    });
    it("sin respuesta es fallo (undefined !== boolean)", () => {
      expect(gradeAnswer(ExerciseType.TRUE_FALSE, {}, { value: false }, {}, 1))
        .toEqual({ autoCorrect: false, autoScore: 0 });
    });
  });

  describe("FILL_BLANKS", () => {
    const sol = { answers: [["go"], ["went", "gone"]] };
    it("todos los huecos correctos -> autoCorrect true y puntuación completa", () => {
      expect(
        gradeAnswer(ExerciseType.FILL_BLANKS, {}, sol, { answers: ["go", "went"] }, 2),
      ).toEqual({ autoCorrect: true, autoScore: 2 });
    });
    it("acepta cualquiera de las alternativas de un hueco", () => {
      expect(
        gradeAnswer(ExerciseType.FILL_BLANKS, {}, sol, { answers: ["go", "gone"] }, 2),
      ).toEqual({ autoCorrect: true, autoScore: 2 });
    });
    it("puntuación parcial proporcional", () => {
      const r = gradeAnswer(ExerciseType.FILL_BLANKS, {}, sol, { answers: ["go", "xxx"] }, 2);
      expect(r.autoCorrect).toBe(false);
      expect(r.autoScore).toBeCloseTo(1);
    });
    it("no distingue mayúsculas por defecto y recorta espacios", () => {
      expect(
        gradeAnswer(ExerciseType.FILL_BLANKS, {}, sol, { answers: [" GO ", "WENT"] }, 2),
      ).toEqual({ autoCorrect: true, autoScore: 2 });
    });
    it("respeta caseSensitive cuando está activo", () => {
      const cs = { answers: [["Go"]], caseSensitive: true };
      expect(gradeAnswer(ExerciseType.FILL_BLANKS, {}, cs, { answers: ["go"] }, 1).autoCorrect)
        .toBe(false);
      expect(gradeAnswer(ExerciseType.FILL_BLANKS, {}, cs, { answers: ["Go"] }, 1).autoCorrect)
        .toBe(true);
    });
    it("sin soluciones definidas requiere revisión manual", () => {
      expect(gradeAnswer(ExerciseType.FILL_BLANKS, {}, { answers: [] }, { answers: [] }, 1))
        .toEqual({ autoCorrect: null, autoScore: 0 });
    });
  });

  describe("SHORT_ANSWER", () => {
    const sol = { accepted: ["London", "london city"] };
    it("acepta normalizando mayúsculas/espacios", () => {
      expect(gradeAnswer(ExerciseType.SHORT_ANSWER, {}, sol, { value: "  LONDON " }, 1))
        .toEqual({ autoCorrect: true, autoScore: 1 });
    });
    it("rechaza respuesta no incluida", () => {
      expect(gradeAnswer(ExerciseType.SHORT_ANSWER, {}, sol, { value: "Paris" }, 1))
        .toEqual({ autoCorrect: false, autoScore: 0 });
    });
  });

  describe("MATCH_COLUMNS", () => {
    const sol = { pairs: [[0, 1], [1, 0]] };
    it("acierto independiente del orden de los pares", () => {
      expect(gradeAnswer(ExerciseType.MATCH_COLUMNS, {}, sol, { pairs: [[1, 0], [0, 1]] }, 3))
        .toEqual({ autoCorrect: true, autoScore: 3 });
    });
    it("fallo si un par no coincide", () => {
      expect(gradeAnswer(ExerciseType.MATCH_COLUMNS, {}, sol, { pairs: [[0, 0], [1, 1]] }, 3))
        .toEqual({ autoCorrect: false, autoScore: 0 });
    });
  });

  describe("ORDER_WORDS", () => {
    // payload.words están en el orden correcto -> el orden esperado es 0,1,2
    const pay = { words: ["I", "love", "English"] };
    it("acierto con el orden exacto", () => {
      expect(gradeAnswer(ExerciseType.ORDER_WORDS, pay, {}, { order: [0, 1, 2] }, 2))
        .toEqual({ autoCorrect: true, autoScore: 2 });
    });
    it("fallo con orden distinto aunque tenga los mismos índices", () => {
      expect(gradeAnswer(ExerciseType.ORDER_WORDS, pay, {}, { order: [1, 0, 2] }, 2))
        .toEqual({ autoCorrect: false, autoScore: 0 });
    });
  });

  describe("READING / LISTENING", () => {
    const pay = {
      questions: [{ accepted: ["yes"] }, { accepted: ["blue", "azul"] }],
    };
    it("puntuación completa con todas correctas", () => {
      expect(
        gradeAnswer(ExerciseType.READING, pay, {}, { answers: ["YES", "Azul"] }, 4),
      ).toEqual({ autoCorrect: true, autoScore: 4 });
    });
    it("puntuación parcial proporcional al nº de aciertos", () => {
      const r = gradeAnswer(ExerciseType.LISTENING, pay, {}, { answers: ["yes", "rojo"] }, 4);
      expect(r.autoCorrect).toBe(false);
      expect(r.autoScore).toBeCloseTo(2);
    });
    it("sin preguntas requiere revisión manual", () => {
      expect(gradeAnswer(ExerciseType.READING, { questions: [] }, {}, { answers: [] }, 1))
        .toEqual({ autoCorrect: null, autoScore: 0 });
    });
  });

  describe("WRITING y tipos desconocidos", () => {
    it("WRITING siempre requiere corrección manual", () => {
      expect(gradeAnswer(ExerciseType.WRITING, {}, {}, { value: "My essay" }, 5))
        .toEqual({ autoCorrect: null, autoScore: 0 });
    });
    it("tipo no soportado cae en revisión manual", () => {
      expect(gradeAnswer("UNKNOWN" as ExerciseType, {}, {}, {}, 1))
        .toEqual({ autoCorrect: null, autoScore: 0 });
    });
  });
});
