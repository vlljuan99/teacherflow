import { env } from "@/lib/env";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface ExtractedSection {
  title?: string;
  summary?: string;
  vocab: {
    term: string;
    translation?: string;
    type: "VOCAB" | "PHRASAL_VERB" | "IDIOM" | "COLLOCATION";
    exampleSentence?: string;
  }[];
  grammar: {
    topic: string;
    normalized: string;
    notes?: string;
  }[];
  assessments: {
    kind: "WRITING" | "READING" | "LISTENING" | "SPEAKING" | "TEST" | "OTHER";
    score?: number;
    maxScore?: number;
    comment?: string;
  }[];
}

const SYSTEM_PROMPT = `Eres un asistente que extrae información estructurada del cuaderno de una clase de inglés.
Recibirás el texto de UNA sesión (una fecha) del cuaderno de un alumno.
Devuelve JSON estricto siguiendo el esquema dado.

Reglas:
- "vocab": palabras, expresiones, phrasal verbs, idioms o collocations que aparecen como vocabulario nuevo.
  - "type": "PHRASAL_VERB" si es phrasal verb, "IDIOM" para idioms, "COLLOCATION" para collocations habituales, "VOCAB" por defecto.
  - "translation": solo si aparece explícita en el texto (no inventes).
  - "exampleSentence": solo si aparece en el texto.
- "grammar": temas gramaticales trabajados.
  - "normalized" debe ser una clave estable en mayúsculas: PRESENT_SIMPLE, PRESENT_CONTINUOUS, PAST_SIMPLE, PAST_CONTINUOUS, PRESENT_PERFECT, PRESENT_PERFECT_CONTINUOUS, PAST_PERFECT, PAST_PERFECT_CONTINUOUS, FUTURE_SIMPLE, FUTURE_CONTINUOUS, CONDITIONALS_0, CONDITIONALS_1, CONDITIONALS_2, CONDITIONALS_3, MODALS, PASSIVE_VOICE, REPORTED_SPEECH, GERUNDS_INFINITIVES, RELATIVE_CLAUSES, COMPARATIVES, PHRASAL_VERBS, ARTICLES, PREPOSITIONS, OTHER. Usa OTHER si no encaja.
- "assessments": tests, writings, readings, listenings, speakings con o sin nota.
  - "kind" en mayúsculas según corresponda. Si solo hay nota numérica suelta (ej. "(8.5)") al lado de un ejercicio, asume el tipo del ejercicio.
  - "score" y "maxScore" numéricos cuando aparezcan (ej. "8.5/10" -> score 8.5 maxScore 10).
- "summary": una frase corta (máx 25 palabras) describiendo qué se trabajó.
- "title": si la sesión tiene un título claro (ej. "GRAMMAR REVIEW: Present and Past Simple"), úsalo. Si no, déjalo vacío.

Si el texto está vacío o no contiene contenido didáctico, devuelve listas vacías.

NO incluyas comentarios, NO uses markdown, NO añadas campos extra. Devuelve solo JSON válido.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    vocab: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          translation: { type: "string" },
          type: {
            type: "string",
            enum: ["VOCAB", "PHRASAL_VERB", "IDIOM", "COLLOCATION"],
          },
          exampleSentence: { type: "string" },
        },
        required: ["term", "type"],
      },
    },
    grammar: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          normalized: { type: "string" },
          notes: { type: "string" },
        },
        required: ["topic", "normalized"],
      },
    },
    assessments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["WRITING", "READING", "LISTENING", "SPEAKING", "TEST", "OTHER"],
          },
          score: { type: "number" },
          maxScore: { type: "number" },
          comment: { type: "string" },
        },
        required: ["kind"],
      },
    },
  },
  required: ["vocab", "grammar", "assessments"],
};

export async function extractSection(text: string): Promise<ExtractedSection> {
  const { GOOGLE_API_KEY, AI_EXTRACT_MODEL } = env();
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not configured");
  const url = `${GEMINI_URL}/${AI_EXTRACT_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini extract failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    return { vocab: [], grammar: [], assessments: [] };
  }
  try {
    const parsed = JSON.parse(rawText) as ExtractedSection;
    return {
      title: parsed.title,
      summary: parsed.summary,
      vocab: parsed.vocab ?? [],
      grammar: parsed.grammar ?? [],
      assessments: parsed.assessments ?? [],
    };
  } catch {
    return { vocab: [], grammar: [], assessments: [] };
  }
}
