import { ExerciseType, WorksheetKind, WorksheetStatus, EnglishLevel } from "@/lib/enums";

interface MCQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

interface TFQuestion {
  prompt: string;
  value: boolean;
}

export const PLACEMENT_TEST_TITLE = "Placement Test (CEFR)";

const GRAMMAR_QUESTIONS: MCQuestion[] = [
  {
    prompt: "If I _____ enough money, I would travel more often.",
    options: ["have", "had", "would have", "will have"],
    correctIndex: 1,
  },
  {
    prompt: "She _____ English since she was ten.",
    options: ["studies", "is studying", "has studied", "studied"],
    correctIndex: 2,
  },
  {
    prompt: "This book _____ by thousands of students every year.",
    options: ["reads", "is read", "read", "has reading"],
    correctIndex: 1,
  },
  {
    prompt: "I'm tired because I _____ all morning.",
    options: ["have worked", "have been working", "worked", "am working"],
    correctIndex: 1,
  },
  {
    prompt: "You _____ use your phone during the exam. It's forbidden.",
    options: ["don't have to", "mustn't", "shouldn't have", "might not"],
    correctIndex: 1,
  },
  {
    prompt: "He told me that he _____ the film before.",
    options: ["saw", "has seen", "had seen", "would see"],
    correctIndex: 2,
  },
  {
    prompt: "I'm looking forward to _____ you again.",
    options: ["see", "seeing", "saw", "seen"],
    correctIndex: 1,
  },
  {
    prompt: "We had to _____ the meeting because the teacher was ill.",
    options: ["call off", "put up", "take after", "look into"],
    correctIndex: 0,
  },
  {
    prompt: "The film was _____ boring that I fell asleep.",
    options: ["such", "so", "too", "enough"],
    correctIndex: 1,
  },
  {
    prompt: "I don't know what this word means. I'll _____ it up.",
    options: ["look", "put", "get", "take"],
    correctIndex: 0,
  },
];

const READING_TEXT = `Remote Work

A few years ago, most people worked in an office every day. Today, however, remote work has become much more common. Thanks to technology, many employees can work from home, from a café or even while travelling.

One of the biggest advantages of remote work is flexibility. Workers can organise their time more freely and avoid long journeys to the office. This can reduce stress and give people more time for their family, hobbies or rest.

However, remote work also has disadvantages. Some people find it difficult to separate their job from their personal life. When your home is also your workplace, you may check emails late at night or continue working after your official working hours.

Another problem is loneliness. Offices are not only places to work; they are also places where people talk, share ideas and feel part of a team. For this reason, some workers prefer a mixed system: working from home some days and going to the office on others.`;

const READING_MC: MCQuestion[] = [
  {
    prompt: "Remote work has become more common because…",
    options: [
      "people hate offices.",
      "technology makes it possible.",
      "cafés are cheaper than offices.",
      "people travel more than before.",
    ],
    correctIndex: 1,
  },
  {
    prompt: "One advantage of remote work is that workers…",
    options: [
      "can organise their time more freely.",
      "never feel stressed.",
      "do not have to work hard.",
      "always earn more money.",
    ],
    correctIndex: 0,
  },
  {
    prompt: "Some people work too much from home because…",
    options: [
      "they have too many hobbies.",
      "they cannot separate work from personal life.",
      "their homes are very noisy.",
      "they dislike their jobs.",
    ],
    correctIndex: 1,
  },
  {
    prompt: "Why can offices be important?",
    options: [
      "They are always more comfortable.",
      "They help people feel part of a team.",
      "They make people work less.",
      "They are better than homes.",
    ],
    correctIndex: 1,
  },
  {
    prompt: "What solution do some workers prefer?",
    options: [
      "Working only at night.",
      "Never going to the office.",
      "A mixed system.",
      "Travelling while working.",
    ],
    correctIndex: 2,
  },
];

const READING_TF: TFQuestion[] = [
  { prompt: "Remote work can help people avoid long journeys to work.", value: true },
  { prompt: "The text says remote work has no disadvantages.", value: false },
  { prompt: "Some people may check work emails late at night.", value: true },
  { prompt: "Offices can be social places.", value: true },
  { prompt: "The text says everyone should work from home every day.", value: false },
];

interface ExerciseSpec {
  type: string;
  order: number;
  prompt: string;
  payload: string;
  solution: string;
  points: number;
}

export function buildPlacementExercises(): ExerciseSpec[] {
  const exercises: ExerciseSpec[] = [];
  let order = 0;

  // Part 1 — Grammar (10 multiple choice, 1 point each)
  for (const q of GRAMMAR_QUESTIONS) {
    exercises.push({
      type: ExerciseType.MULTIPLE_CHOICE,
      order: order++,
      prompt: `Part 1 — Grammar & Vocabulary · ${q.prompt}`,
      payload: JSON.stringify({
        options: q.options,
        multiple: false,
      }),
      solution: JSON.stringify({ correct: [q.correctIndex] }),
      points: 1,
    });
  }

  // Part 2 — Reading (5 MC + 5 TF) — embed the reading passage in each prompt
  const readingHeader = `Part 2 — Reading\n\n${READING_TEXT}\n\nAnswer the question:`;
  for (const q of READING_MC) {
    exercises.push({
      type: ExerciseType.MULTIPLE_CHOICE,
      order: order++,
      prompt: `${readingHeader}\n\n${q.prompt}`,
      payload: JSON.stringify({ options: q.options, multiple: false }),
      solution: JSON.stringify({ correct: [q.correctIndex] }),
      points: 1,
    });
  }
  for (const q of READING_TF) {
    exercises.push({
      type: ExerciseType.TRUE_FALSE,
      order: order++,
      prompt: `Part 2 — Reading (True / False) · ${q.prompt}`,
      payload: JSON.stringify({}),
      solution: JSON.stringify({ value: q.value }),
      points: 1,
    });
  }

  // Part 3 — Writing (manual correction, 10 points)
  exercises.push({
    type: ExerciseType.WRITING,
    order: order++,
    prompt: `Part 3 — Writing (≈100 words)

Your English friend wants to visit your town for a weekend. Write an email to your friend.

Include:
- what places they should visit
- what food they should try
- what you can do together

Remember: greeting, intro, body (2 paragraphs), conclusion, sign-off.`,
    payload: JSON.stringify({ minWords: 80, maxWords: 150 }),
    solution: JSON.stringify({ rubric: "Greetings + intro + 2 body paragraphs + closing." }),
    points: 10,
  });

  return exercises;
}

export const PLACEMENT_WORKSHEET_DEFAULTS = {
  title: PLACEMENT_TEST_TITLE,
  description:
    "Test de nivelación con 20 preguntas autocorregibles + 1 writing manual. Sugerirá un nivel CEFR (A1–C2).",
  level: EnglishLevel.B1,
  topic: "Placement",
  language: "EN",
  status: WorksheetStatus.PUBLISHED,
  kind: WorksheetKind.PLACEMENT_TEST,
};

/**
 * Map auto-graded score (out of 20 auto-gradable points) to a CEFR level.
 * The Writing part (10 pts) is manual and not included here.
 */
export function suggestLevel(autoScore: number): EnglishLevel {
  const ratio = autoScore / 20;
  if (ratio >= 0.9) return EnglishLevel.C2;
  if (ratio >= 0.75) return EnglishLevel.C1;
  if (ratio >= 0.6) return EnglishLevel.B2;
  if (ratio >= 0.45) return EnglishLevel.B1;
  if (ratio >= 0.25) return EnglishLevel.A2;
  return EnglishLevel.A1;
}
