"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role, EnglishLevel } from "@/lib/enums";
import {
  gradeGrammar,
  gradeReading,
  computeFinalScore,
  scoreToCefr,
} from "@/server/placement-test/grade";
import { audit } from "@/server/audit/log";

async function getOrCreateTest(studentId: string) {
  let test = await prisma.placementTest.findUnique({ where: { studentId } });
  if (!test) {
    test = await prisma.placementTest.create({ data: { studentId } });
  }
  return test;
}

export async function startPlacementTest(studentId: string) {
  await requireRole(Role.TEACHER);
  await getOrCreateTest(studentId);
  redirect(`/students/${studentId}/placement-test`);
}

export async function saveGrammar(
  studentId: string,
  answers: (string | null)[],
) {
  const session = await requireRole(Role.TEACHER);
  const test = await getOrCreateTest(studentId);
  const { score10 } = gradeGrammar(answers);
  await prisma.placementTest.update({
    where: { id: test.id },
    data: {
      grammarAnswers: JSON.stringify(answers),
      grammarScore: score10,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.grammar.save",
    entity: "PlacementTest",
    entityId: test.id,
  });
  revalidatePath(`/students/${studentId}/placement-test`);
}

export async function saveReading(
  studentId: string,
  answers: (string | null)[],
) {
  const session = await requireRole(Role.TEACHER);
  const test = await getOrCreateTest(studentId);
  const { score10 } = gradeReading(answers);
  await prisma.placementTest.update({
    where: { id: test.id },
    data: {
      readingAnswers: JSON.stringify(answers),
      readingScore: score10,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.reading.save",
    entity: "PlacementTest",
    entityId: test.id,
  });
  revalidatePath(`/students/${studentId}/placement-test`);
}

export async function saveWriting(
  studentId: string,
  data: { text: string; score: number | null; comment: string },
) {
  const session = await requireRole(Role.TEACHER);
  const test = await getOrCreateTest(studentId);
  const clampedScore =
    data.score == null
      ? null
      : Math.max(0, Math.min(10, Math.round(data.score * 10) / 10));
  await prisma.placementTest.update({
    where: { id: test.id },
    data: {
      writingText: data.text || null,
      writingScore: clampedScore,
      writingComment: data.comment || null,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.writing.save",
    entity: "PlacementTest",
    entityId: test.id,
  });
  revalidatePath(`/students/${studentId}/placement-test`);
}

export async function saveSpeaking(
  studentId: string,
  data: { notes: string; score: number | null; comment: string },
) {
  const session = await requireRole(Role.TEACHER);
  const test = await getOrCreateTest(studentId);
  const clampedScore =
    data.score == null
      ? null
      : Math.max(0, Math.min(10, Math.round(data.score * 10) / 10));
  await prisma.placementTest.update({
    where: { id: test.id },
    data: {
      speakingNotes: data.notes || null,
      speakingScore: clampedScore,
      speakingComment: data.comment || null,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.speaking.save",
    entity: "PlacementTest",
    entityId: test.id,
  });
  revalidatePath(`/students/${studentId}/placement-test`);
}

export async function finalizePlacementTest(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  const test = await prisma.placementTest.findUnique({ where: { studentId } });
  if (!test) throw new Error("Test not found");
  const finalScore = computeFinalScore({
    grammar: test.grammarScore,
    reading: test.readingScore,
    writing: test.writingScore,
    speaking: test.speakingScore,
  });
  if (finalScore == null) throw new Error("Faltan partes por puntuar");
  const cefr = scoreToCefr(finalScore);
  await prisma.$transaction([
    prisma.placementTest.update({
      where: { id: test.id },
      data: {
        finalScore,
        cefrLevel: cefr,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    }),
    prisma.student.update({
      where: { id: studentId },
      data: { level: cefr as keyof typeof EnglishLevel },
    }),
  ]);
  await audit({
    actorUserId: session.user.id,
    action: "placement.finalize",
    entity: "PlacementTest",
    entityId: test.id,
  });
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/students/${studentId}/placement-test`);
}

export async function resetPlacementTest(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.placementTest.deleteMany({ where: { studentId } });
  await audit({
    actorUserId: session.user.id,
    action: "placement.reset",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}/placement-test`);
}
