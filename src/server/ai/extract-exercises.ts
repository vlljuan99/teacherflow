import { env } from "@/lib/env";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Output schema returned by Gemini. Mirrors the Worksheet/Exercise model in
// Prisma but keeps a few extras (confidence, sourcePage) for the review screen.
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type ExtractedExerciseType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANKS"
  | "SHORT_ANSWER"
  | "MATCH_COLUMNS"
  | "ORDER_WORDS"
  | "READING"
  | "WRITING";

export interface ExtractedExercise {
  type: ExtractedExerciseType;
  prompt: string;
  points: number;
  confidence: Confidence;
  sourcePage?: number;
  reviewNote?: string;
  // Type-specific payload — only the relevant key is populated.
  mcq?: { options: string[]; correct: number[]; multi?: boolean };
  trueFalse?: { value: boolean };
  fillBlanks?: { template: string; answers: string[][] };
  shortAnswer?: { accepted: string[] };
  matchColumns?: { left: string[]; right: string[]; pairs: number[][] };
  orderWords?: { words: string[] };
  reading?: { passage: string; questions: { prompt: string; accepted: string[] }[] };
  writing?: { prompt: string; minWords?: number; maxWords?: number };
}

export interface ExtractedSection {
  title: string;
  exercises: ExtractedExercise[];
}

export interface ExtractedWorksheet {
  title: string;
  description?: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  examType?: string;
  language?: "EN" | "ES";
  sections: ExtractedSection[];
}

const SYSTEM_PROMPT = `Eres un asistente que convierte exámenes y fichas de inglés en formato PDF en ejercicios estructurados para una plataforma web de aprendizaje.

Recibirás un PDF completo. Devuelve JSON estricto siguiendo el schema.

Reglas globales:
- Lee TODO el PDF, incluyendo la sección de "CORRECCIONES" / "Answer Key" si existe — DE AHÍ sacas la respuesta correcta, no te la inventes.
- Si el PDF tiene typos en la clave de respuestas ("DECLIDE" en lugar de "DECLINE"), corrige al inglés correcto en el campo solution.
- Agrupa los ejercicios en "sections" con el título original del PDF (GRAMMAR, VOCABULARY, READING, etc.).
- Para cada ejercicio asigna "confidence":
  - HIGH: la pregunta y respuesta están claras y verificadas con la clave del PDF.
  - MEDIUM: la pregunta está clara pero la respuesta requiere interpretación o no aparece en clave.
  - LOW: layout ambiguo, dependencia de imágenes que no puedes ver, o respuesta no encontrada — déjala marcada para revisión humana.
- "reviewNote" (opcional): nota corta (max 100 chars) explicando por qué la confianza es MEDIUM/LOW, o algo que la profesora debe revisar.
- "sourcePage": el número de página del PDF donde aparece la pregunta (1-indexed).

Mapeo de tipos del PDF a "type":
- "Multiple choice" / opción única → MULTIPLE_CHOICE con multi=false. "correct" es array con UN índice [n].
- "Multiple answer" / varias respuestas → MULTIPLE_CHOICE con multi=true. "correct" tiene varios índices.
- "Fill in the blank" con opciones de cierre (word bank o sin opciones) → FILL_BLANKS. Template usa "___" (3 guiones bajos) por cada hueco. "answers" es array de arrays: cada hueco admite varias formas válidas (ej. ["was","were"] si las dos sirven).
- "Cloze" con multiple choice POR cada hueco → divide en MULTIPLE_CHOICE separados, cada uno con su propio prompt mostrando el contexto.
- "Matching" / relacionar columnas → MATCH_COLUMNS. left[] y right[]; pairs es array de [iIzq, iDer].
- "Reading" con varias preguntas sobre un mismo texto → READING. passage es el texto completo, questions es array.
- "Reading" donde varias afirmaciones se asignan a personas (Person A/B/C/D) → MATCH_COLUMNS. left=afirmaciones, right=["Person A","Person B",…], pairs según la solución del PDF. Incluye el texto completo de cada persona dentro del prompt principal o el primer ejercicio.
- "Reading" con titulares para párrafos numerados → MATCH_COLUMNS. left=["Paragraph 1","Paragraph 2",…], right=titulares.
- "Writing" → WRITING. Define minWords/maxWords si el PDF los pide ("150 words" → minWords=140, maxWords=180).
- "Speaking" → SHORT_ANSWER con points=manual. Pon el prompt en prompt y "accepted" vacío (corrección manual). Nota: marca confidence=MEDIUM y reviewNote="Speaking — corrección manual".
- "True/False" o "Yes/No" → TRUE_FALSE.
- "Order words" / "Unscramble" → ORDER_WORDS.

Reglas de puntos:
- Pon "points": 1 a cada ejercicio individual de Grammar/Vocab/Reading.
- Para Writing y Speaking: 10 puntos.
- Si el PDF especifica puntuación (ej. "(5 marks)"), úsala.

Reglas de formato:
- NO incluyas opciones vacías o duplicadas.
- En "prompt", incluye el número original del ejercicio si era numerado ("1. The woman ___ sold me…").
- Si el PDF tiene una sección VOCABULARY con varios sub-ejercicios numerados (1, 2, 3...) cada uno con su matching, crea un MATCH_COLUMNS por cada sub-ejercicio, prompt incluyendo el número.

Devuelve SOLO JSON válido, sin markdown ni comentarios.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    level: {
      type: "string",
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
    examType: { type: "string" },
    language: { type: "string", enum: ["EN", "ES"] },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "MULTIPLE_CHOICE",
                    "TRUE_FALSE",
                    "FILL_BLANKS",
                    "SHORT_ANSWER",
                    "MATCH_COLUMNS",
                    "ORDER_WORDS",
                    "READING",
                    "WRITING",
                  ],
                },
                prompt: { type: "string" },
                points: { type: "number" },
                confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                sourcePage: { type: "number" },
                reviewNote: { type: "string" },
                mcq: {
                  type: "object",
                  properties: {
                    options: { type: "array", items: { type: "string" } },
                    correct: { type: "array", items: { type: "number" } },
                    multi: { type: "boolean" },
                  },
                },
                trueFalse: {
                  type: "object",
                  properties: { value: { type: "boolean" } },
                },
                fillBlanks: {
                  type: "object",
                  properties: {
                    template: { type: "string" },
                    answers: {
                      type: "array",
                      items: { type: "array", items: { type: "string" } },
                    },
                  },
                },
                shortAnswer: {
                  type: "object",
                  properties: {
                    accepted: { type: "array", items: { type: "string" } },
                  },
                },
                matchColumns: {
                  type: "object",
                  properties: {
                    left: { type: "array", items: { type: "string" } },
                    right: { type: "array", items: { type: "string" } },
                    pairs: {
                      type: "array",
                      items: { type: "array", items: { type: "number" } },
                    },
                  },
                },
                orderWords: {
                  type: "object",
                  properties: {
                    words: { type: "array", items: { type: "string" } },
                  },
                },
                reading: {
                  type: "object",
                  properties: {
                    passage: { type: "string" },
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          prompt: { type: "string" },
                          accepted: { type: "array", items: { type: "string" } },
                        },
                        required: ["prompt"],
                      },
                    },
                  },
                },
                writing: {
                  type: "object",
                  properties: {
                    prompt: { type: "string" },
                    minWords: { type: "number" },
                    maxWords: { type: "number" },
                  },
                  required: ["prompt"],
                },
              },
              required: ["type", "prompt", "points", "confidence"],
            },
          },
        },
        required: ["title", "exercises"],
      },
    },
  },
  required: ["title", "level", "sections"],
};

export async function extractExercisesFromPdf(
  pdfBytes: Buffer | Uint8Array,
): Promise<ExtractedWorksheet> {
  const { GOOGLE_API_KEY, AI_EXTRACT_MODEL } = env();
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured");
  const url = `${GEMINI_URL}/${AI_EXTRACT_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;
  const base64 = Buffer.from(pdfBytes).toString("base64");

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "application/pdf", data: base64 } },
          { text: "Convierte este PDF en ejercicios estructurados siguiendo el schema." },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 32768,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini extract-exercises failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Gemini returned empty response");
  }
  const parsed = JSON.parse(rawText) as ExtractedWorksheet;
  return parsed;
}

// Convert an ExtractedExercise into the {payload, solution} pair that the
// Exercise model and the ExerciseEditor/Solver expect. Keep an "_extraction"
// meta key on payload so the review UI can show confidence + sourcePage
// without an extra DB column.
export function toExerciseRow(e: ExtractedExercise, order: number) {
  const meta = {
    _extraction: {
      confidence: e.confidence,
      sourcePage: e.sourcePage ?? null,
      reviewNote: e.reviewNote ?? null,
    },
  };

  switch (e.type) {
    case "MULTIPLE_CHOICE": {
      const mcq = e.mcq ?? { options: [], correct: [], multi: false };
      return {
        type: e.type,
        order,
        prompt: e.prompt,
        points: e.points,
        payload: JSON.stringify({ options: mcq.options, multi: Boolean(mcq.multi), ...meta }),
        solution: JSON.stringify({ correct: mcq.correct }),
      };
    }
    case "TRUE_FALSE":
      return {
        type: e.type,
        order,
        prompt: e.prompt,
        points: e.points,
        payload: JSON.stringify(meta),
        solution: JSON.stringify({ value: e.trueFalse?.value ?? true }),
      };
    case "FILL_BLANKS": {
      const fb = e.fillBlanks ?? { template: "", answers: [] };
      return {
        type: e.type,
        order,
        prompt: e.prompt,
        points: e.points,
        payload: JSON.stringify({ template: fb.template, ...meta }),
        solution: JSON.stringify({ answers: fb.answers, caseSensitive: false }),
      };
    }
    case "SHORT_ANSWER":
      return {
        type: e.type,
        order,
        prompt: e.prompt,
        points: e.points,
        payload: JSON.stringify(meta),
        solution: JSON.stringify({ accepted: e.shortAnswer?.accepted ?? [] }),
      };
    case "MATCH_COLUMNS": {
      const mc = e.matchColumns ?? { left: [], right: [], pairs: [] };
      return {
        type: e.type,
        order,
        prompt: e.prompt,
        points: e.points,
        payload: JSON.stringify({ left: mc.left, right: mc.right, ...meta }),
        solution: JSON.stringify({ pairs: mc.pairs }),
      };
    }
    case "ORDER_WORDS":
      return {
        type: e.type,
        order,
        prompt: e.prompt,
        points: e.points,
        payload: JSON.stringify({ words: e.orderWords?.words ?? [], ...meta }),
        solution: JSON.stringify({}),
      };
    case "READING": {
      const r = e.reading ?? { passage: "", questions: [] };
      return {
        type: e.type,
        order,
        prompt: e.prompt,
        points: e.points,
        payload: JSON.stringify({
          passage: r.passage,
          questions: r.questions,
          ...meta,
        }),
        solution: JSON.stringify({}),
      };
    }
    case "WRITING": {
      const w = e.writing ?? { prompt: e.prompt };
      return {
        type: e.type,
        order,
        prompt: e.prompt,
        points: e.points,
        payload: JSON.stringify({
          prompt: w.prompt,
          minWords: w.minWords ?? 50,
          maxWords: w.maxWords ?? 200,
          ...meta,
        }),
        solution: JSON.stringify({}),
      };
    }
  }
}
