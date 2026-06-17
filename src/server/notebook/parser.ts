import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { exportDocAsPlainText, getDocMeta } from "@/server/google/drive";
import { extractSection } from "@/server/ai/extract";
import { embedTexts, serializeVector } from "@/server/ai/embeddings";

const DATE_RE = /^\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\s*$/;
const MAX_CHUNK_CHARS = 1200;

interface Section {
  date: Date;
  text: string;
}

export function splitByDate(rawText: string): Section[] {
  const lines = rawText.split(/\r?\n/);
  const sections: Section[] = [];
  let current: { date: Date; lines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(DATE_RE);
    if (m) {
      if (current && current.lines.join("\n").trim().length > 0) {
        sections.push({ date: current.date, text: current.lines.join("\n").trim() });
      }
      const day = Number(m[1]);
      const month = Number(m[2]) - 1;
      let year = Number(m[3]);
      if (year < 100) year += 2000;
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        current = { date, lines: [] };
      } else {
        current = null;
      }
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current && current.lines.join("\n").trim().length > 0) {
    sections.push({ date: current.date, text: current.lines.join("\n").trim() });
  }
  return sections;
}

function sha(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function chunk(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const paragraphs = text.split(/\n{2,}/);
  const out: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > maxChars && buf) {
      out.push(buf);
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf) out.push(buf);
  return out;
}

interface ParseResult {
  parsedSections: number;
  skippedUnchanged: number;
  failedSections: number;
}

export async function parseStudentNotebook(
  teacherUserId: string,
  studentId: string,
): Promise<ParseResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { notebookDocId: true },
  });
  if (!student?.notebookDocId) {
    return { parsedSections: 0, skippedUnchanged: 0, failedSections: 0 };
  }

  const rawText = await exportDocAsPlainText(teacherUserId, student.notebookDocId);
  const sections = splitByDate(rawText);

  let parsed = 0;
  let skipped = 0;
  let failed = 0;

  for (const section of sections) {
    const hash = sha(`${section.date.toISOString()}|${section.text}`);
    const existing = await prisma.sessionLog.findUnique({
      where: { studentId_sourceHash: { studentId, sourceHash: hash } },
    });
    if (existing && existing.status === "PARSED") {
      skipped += 1;
      continue;
    }

    let logId: string;
    if (existing) {
      logId = existing.id;
    } else {
      const created = await prisma.sessionLog.create({
        data: {
          studentId,
          sessionDate: section.date,
          rawText: section.text,
          sourceHash: hash,
          status: "PENDING",
        },
      });
      logId = created.id;
    }

    try {
      const extracted = await extractSection(section.text);
      const chunks = chunk(section.text, MAX_CHUNK_CHARS);
      const vectors = await embedTexts(chunks);

      await prisma.$transaction([
        prisma.sessionVocab.deleteMany({ where: { sessionLogId: logId } }),
        prisma.sessionGrammar.deleteMany({ where: { sessionLogId: logId } }),
        prisma.sessionAssessment.deleteMany({ where: { sessionLogId: logId } }),
        prisma.embeddingChunk.deleteMany({ where: { sessionLogId: logId } }),
        prisma.sessionLog.update({
          where: { id: logId },
          data: {
            title: extracted.title || null,
            summary: extracted.summary || null,
            status: "PARSED",
            parsedAt: new Date(),
            errorMessage: null,
          },
        }),
        prisma.sessionVocab.createMany({
          data: extracted.vocab.map((v) => ({
            sessionLogId: logId,
            term: v.term,
            translation: v.translation ?? null,
            type: v.type,
            exampleSentence: v.exampleSentence ?? null,
          })),
        }),
        prisma.sessionGrammar.createMany({
          data: extracted.grammar.map((g) => ({
            sessionLogId: logId,
            topic: g.topic,
            normalized: g.normalized,
            notes: g.notes ?? null,
          })),
        }),
        prisma.sessionAssessment.createMany({
          data: extracted.assessments.map((a) => ({
            sessionLogId: logId,
            kind: a.kind,
            score: a.score ?? null,
            maxScore: a.maxScore ?? null,
            comment: a.comment ?? null,
          })),
        }),
        prisma.embeddingChunk.createMany({
          data: chunks.map((c, i) => ({
            sessionLogId: logId,
            chunkText: c,
            vector: serializeVector(vectors[i]),
            tokenCount: Math.round(c.length / 4),
          })),
        }),
      ]);
      parsed += 1;
    } catch (err) {
      failed += 1;
      await prisma.sessionLog.update({
        where: { id: logId },
        data: {
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return { parsedSections: parsed, skippedUnchanged: skipped, failedSections: failed };
}

export async function ensureNotebookFresh(
  teacherUserId: string,
  studentId: string,
): Promise<{ triggered: boolean }> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { notebookDocId: true },
  });
  if (!student?.notebookDocId) return { triggered: false };

  const meta = await getDocMeta(teacherUserId, student.notebookDocId);
  if (!meta) return { triggered: false };

  const docModified = new Date(meta.modifiedTime);
  const latest = await prisma.sessionLog.findFirst({
    where: { studentId },
    orderBy: { parsedAt: "desc" },
    select: { parsedAt: true },
  });
  if (latest?.parsedAt && latest.parsedAt >= docModified) {
    return { triggered: false };
  }

  parseStudentNotebook(teacherUserId, studentId).catch((err) => {
    console.error("ensureNotebookFresh background parse failed", err);
  });
  return { triggered: true };
}
