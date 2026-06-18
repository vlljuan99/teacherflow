import { GRAMMAR_QUESTIONS, READING_QUESTIONS, type Question } from "./content";

export function autoGradeSection(
  questions: Question[],
  answers: (string | null)[],
): { correct: number; total: number; score10: number } {
  const total = questions.length;
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (answers[i] && answers[i] === questions[i].correct) correct += 1;
  }
  return { correct, total, score10: (correct / total) * 10 };
}

export function gradeGrammar(answers: (string | null)[]) {
  return autoGradeSection(GRAMMAR_QUESTIONS, answers);
}

export function gradeReading(answers: (string | null)[]) {
  return autoGradeSection(READING_QUESTIONS, answers);
}

/**
 * Final score is the mean of the four parts (each on a 0-10 scale).
 * Returns null if any part is missing.
 */
export function computeFinalScore(parts: {
  grammar: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
}): number | null {
  const { grammar, reading, writing, speaking } = parts;
  if (
    grammar == null ||
    reading == null ||
    writing == null ||
    speaking == null
  ) {
    return null;
  }
  const sum = grammar + reading + writing + speaking;
  return Math.round((sum / 4) * 10) / 10;
}

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/**
 * Map a final score (0-10) to a CEFR level estimate.
 * Calibrated for a placement test that is broadly A2-C1 in scope.
 */
export function scoreToCefr(score: number): CefrLevel {
  if (score < 2) return "A1";
  if (score < 4) return "A2";
  if (score < 6) return "B1";
  if (score < 7.5) return "B2";
  if (score < 9) return "C1";
  return "C2";
}
