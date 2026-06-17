import { env } from "@/lib/env";

const OPENAI_URL = "https://api.openai.com/v1/embeddings";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { OPENAI_API_KEY, AI_EMBED_MODEL } = env();
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  if (texts.length === 0) return [];
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: AI_EMBED_MODEL, input: texts }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    data: { embedding: number[] }[];
    usage: { total_tokens: number };
  };
  return data.data.map((d) => d.embedding);
}

export function serializeVector(v: number[]): string {
  return JSON.stringify(v);
}

export function deserializeVector(s: string): number[] {
  return JSON.parse(s) as number[];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
