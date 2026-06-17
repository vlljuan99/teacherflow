import { ExerciseType } from "@/lib/enums";

export interface GradeResult {
  autoCorrect: boolean | null; // null = requires manual review
  autoScore: number; // 0..points
}

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function shallowEqualNumberArray(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function shallowEqualPairs(a: number[][], b: number[][]) {
  if (a.length !== b.length) return false;
  const key = (p: number[]) => `${p[0]}->${p[1]}`;
  const A = new Set(a.map(key));
  for (const p of b) if (!A.has(key(p))) return false;
  return true;
}

export function gradeAnswer(
  type: ExerciseType,
  payload: unknown,
  solution: unknown,
  answer: unknown,
  points = 1,
): GradeResult {
  const sol = solution as Record<string, unknown>;
  const pay = payload as Record<string, unknown>;

  switch (type) {
    case ExerciseType.MULTIPLE_CHOICE: {
      const selected = (answer as { selected?: number[] })?.selected ?? [];
      const correct = (sol?.correct as number[]) ?? [];
      const ok = shallowEqualNumberArray(selected, correct);
      return { autoCorrect: ok, autoScore: ok ? points : 0 };
    }
    case ExerciseType.TRUE_FALSE: {
      const val = (answer as { value?: boolean })?.value;
      const ok = val === (sol?.value as boolean);
      return { autoCorrect: ok, autoScore: ok ? points : 0 };
    }
    case ExerciseType.FILL_BLANKS: {
      const userAnswers = (answer as { answers?: string[] })?.answers ?? [];
      const accepted = (sol?.answers as string[][]) ?? [];
      const caseSensitive = Boolean(sol?.caseSensitive);
      const total = accepted.length;
      if (total === 0) return { autoCorrect: null, autoScore: 0 };
      let ok = 0;
      for (let i = 0; i < total; i++) {
        const candidates = accepted[i] ?? [];
        const user = userAnswers[i] ?? "";
        const u = caseSensitive ? user.trim() : norm(user);
        if (candidates.map((c) => (caseSensitive ? c.trim() : norm(c))).includes(u)) {
          ok++;
        }
      }
      const score = (ok / total) * points;
      return { autoCorrect: ok === total, autoScore: score };
    }
    case ExerciseType.SHORT_ANSWER: {
      const user = (answer as { value?: string })?.value ?? "";
      const accepted = (sol?.accepted as string[]) ?? [];
      const u = norm(user);
      const ok = accepted.map(norm).includes(u);
      return { autoCorrect: ok, autoScore: ok ? points : 0 };
    }
    case ExerciseType.MATCH_COLUMNS: {
      const pairs = (answer as { pairs?: number[][] })?.pairs ?? [];
      const correct = (sol?.pairs as number[][]) ?? [];
      const ok = shallowEqualPairs(pairs, correct);
      return { autoCorrect: ok, autoScore: ok ? points : 0 };
    }
    case ExerciseType.ORDER_WORDS: {
      const userOrder = (answer as { order?: number[] })?.order ?? [];
      const words = (pay?.words as string[]) ?? [];
      const correct = words.map((_, i) => i); // payload.words are in correct order
      const ok = shallowEqualNumberArray(userOrder, correct) &&
        userOrder.every((v, i) => v === correct[i]);
      return { autoCorrect: ok, autoScore: ok ? points : 0 };
    }
    case ExerciseType.READING:
    case ExerciseType.LISTENING: {
      const userAns = (answer as { answers?: string[] })?.answers ?? [];
      const questions = (pay?.questions as { accepted?: string[] }[]) ?? [];
      if (questions.length === 0) return { autoCorrect: null, autoScore: 0 };
      let ok = 0;
      for (let i = 0; i < questions.length; i++) {
        const u = norm(userAns[i] ?? "");
        const accepted = (questions[i]?.accepted ?? []).map(norm);
        if (accepted.includes(u)) ok++;
      }
      const score = (ok / questions.length) * points;
      return { autoCorrect: ok === questions.length, autoScore: score };
    }
    case ExerciseType.WRITING:
      return { autoCorrect: null, autoScore: 0 };
    default:
      return { autoCorrect: null, autoScore: 0 };
  }
}
