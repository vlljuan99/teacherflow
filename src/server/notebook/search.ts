import { prisma } from "@/lib/db";
import { embedTexts, cosineSimilarity, deserializeVector } from "@/server/ai/embeddings";

export interface SearchHit {
  sessionLogId: string;
  studentId: string;
  studentName: string;
  sessionDate: Date;
  title: string | null;
  snippet: string;
  score: number;
  notebookDocUrl: string | null;
}

export async function semanticSearch(
  query: string,
  opts: { studentId?: string; limit?: number } = {},
): Promise<SearchHit[]> {
  const limit = opts.limit ?? 10;
  const [queryVec] = await embedTexts([query]);
  if (!queryVec) return [];

  const chunks = await prisma.embeddingChunk.findMany({
    where: opts.studentId ? { sessionLog: { studentId: opts.studentId } } : undefined,
    include: {
      sessionLog: {
        select: {
          id: true,
          studentId: true,
          sessionDate: true,
          title: true,
          student: {
            select: { firstName: true, lastName: true, notebookDocUrl: true },
          },
        },
      },
    },
  });

  type Scored = SearchHit & { _key: string };
  const scored: Scored[] = chunks.map((c) => {
    const vec = deserializeVector(c.vector);
    const score = cosineSimilarity(queryVec, vec);
    return {
      _key: c.sessionLog.id,
      sessionLogId: c.sessionLog.id,
      studentId: c.sessionLog.studentId,
      studentName: `${c.sessionLog.student.firstName} ${c.sessionLog.student.lastName}`,
      sessionDate: c.sessionLog.sessionDate,
      title: c.sessionLog.title,
      snippet: c.chunkText.slice(0, 280),
      score,
      notebookDocUrl: c.sessionLog.student.notebookDocUrl,
    };
  });

  // Keep best chunk per session
  const bestPerSession = new Map<string, Scored>();
  for (const s of scored) {
    const prev = bestPerSession.get(s._key);
    if (!prev || s.score > prev.score) bestPerSession.set(s._key, s);
  }
  return [...bestPerSession.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ _key: _k, ...rest }) => rest);
}
