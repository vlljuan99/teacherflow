"use server";

import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { exportDocAsPlainText } from "@/server/google/drive";
import { appendToDoc } from "@/server/google/docs";
import { audit } from "@/server/audit/log";

const DATE_RE = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\s*$/m;

function todayKey(): string {
  return format(new Date(), "dd/MM/yyyy");
}

function templateBlock(): string {
  return `\n\n${todayKey()}\n\nVocabulary:\n\nGrammar:\n\nSpeaking notes:\n\nWriting:\n\nHomework:\n\n`;
}

/**
 * If today's date heading isn't in the student's notebook yet, append the
 * session template. Idempotent — safe to call on every Live Class load.
 */
export async function prepareClassSession(studentId: string): Promise<{
  notebookUrl: string | null;
  insertedTemplate: boolean;
}> {
  const session = await requireRole(Role.TEACHER);
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { notebookDocId: true, notebookDocUrl: true },
  });
  if (!student?.notebookDocId) {
    return { notebookUrl: student?.notebookDocUrl ?? null, insertedTemplate: false };
  }
  let text: string;
  try {
    text = await exportDocAsPlainText(session.user.id, student.notebookDocId);
  } catch {
    return { notebookUrl: student.notebookDocUrl, insertedTemplate: false };
  }
  // Look for today's date as its own line.
  const today = todayKey();
  const lines = text.split(/\r?\n/);
  const hasToday = lines.some((l) => {
    const m = l.match(DATE_RE);
    if (!m) return false;
    return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${
      m[3].length === 2 ? `20${m[3]}` : m[3]
    }` === today;
  });
  if (hasToday) {
    return { notebookUrl: student.notebookDocUrl, insertedTemplate: false };
  }
  await appendToDoc(session.user.id, student.notebookDocId, templateBlock());
  await audit({
    actorUserId: session.user.id,
    action: "live.template",
    entity: "Student",
    entityId: studentId,
  });
  return { notebookUrl: student.notebookDocUrl, insertedTemplate: true };
}

/**
 * Append a vocab list to the notebook with a small heading for today.
 */
export async function appendVocabToNotebook(
  studentId: string,
  vocab: string[],
): Promise<void> {
  const session = await requireRole(Role.TEACHER);
  const clean = vocab.map((v) => v.trim()).filter(Boolean);
  if (clean.length === 0) return;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { notebookDocId: true },
  });
  if (!student?.notebookDocId) throw new Error("El alumno no tiene cuaderno");
  const body = `\n[Vocab — ${todayKey()}]\n${clean.map((v) => `- ${v}`).join("\n")}\n`;
  await appendToDoc(session.user.id, student.notebookDocId, body);
  await audit({
    actorUserId: session.user.id,
    action: "live.vocab.save",
    entity: "Student",
    entityId: studentId,
    payload: { count: clean.length },
  });
}

export async function saveNextSessionNote(
  studentId: string,
  note: string,
): Promise<void> {
  const session = await requireRole(Role.TEACHER);
  await prisma.student.update({
    where: { id: studentId },
    data: { nextSessionNote: note.trim() || null },
  });
  await audit({
    actorUserId: session.user.id,
    action: "live.next-note.save",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/classes`);
  revalidatePath(`/students/${studentId}`);
}
