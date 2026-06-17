"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CorrectionStatus, Role, AssignmentStatus, ExerciseType, WorksheetKind, PlacementStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { gradeAnswer } from "@/server/grading/auto-grade";
import { safeJsonParse } from "@/lib/utils";
import { audit } from "@/server/audit/log";
import { suggestLevel } from "@/server/placement/template";

interface ExerciseWithType {
  id: string;
  type: string;
  payload: string;
  solution: string;
  points: number;
}

async function ensureSubmissionForStudent(assignmentId: string, studentId: string) {
  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
  if (existing) return existing;
  return prisma.submission.create({
    data: {
      assignmentId,
      studentId,
      correctionStatus: CorrectionStatus.IN_PROGRESS,
    },
  });
}

export async function getOrCreateSubmission(assignmentId: string) {
  const session = await requireRole(Role.STUDENT);
  if (!session.user.studentId) throw new Error("Forbidden");
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { group: { include: { students: { select: { id: true } } } } },
  });
  if (!assignment) throw new Error("Not found");
  const allowed =
    assignment.studentId === session.user.studentId ||
    assignment.group?.students.some((s) => s.id === session.user.studentId);
  if (!allowed) throw new Error("Forbidden");
  return ensureSubmissionForStudent(assignmentId, session.user.studentId);
}

const SaveSchema = z.object({
  submissionId: z.string(),
  answersJson: z.string(),
});

export async function saveProgress(formData: FormData) {
  const session = await requireRole(Role.STUDENT);
  if (!session.user.studentId) throw new Error("Forbidden");
  const { submissionId, answersJson } = SaveSchema.parse(
    Object.fromEntries(formData.entries()),
  );
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: { include: { worksheet: { include: { exercises: true } } } },
    },
  });
  if (!submission || submission.studentId !== session.user.studentId) {
    throw new Error("Forbidden");
  }
  const answers = safeJsonParse(answersJson, {} as Record<string, unknown>);
  const exercises: ExerciseWithType[] = submission.assignment.worksheet.exercises;
  await prisma.$transaction([
    ...exercises.map((ex) =>
      prisma.answer.upsert({
        where: { submissionId_exerciseId: { submissionId, exerciseId: ex.id } },
        update: { value: JSON.stringify(answers[ex.id] ?? {}) },
        create: {
          submissionId,
          exerciseId: ex.id,
          value: JSON.stringify(answers[ex.id] ?? {}),
        },
      }),
    ),
    prisma.submission.update({
      where: { id: submissionId },
      data: { correctionStatus: CorrectionStatus.IN_PROGRESS },
    }),
  ]);
  revalidatePath(`/portal/worksheets/${submission.assignmentId}/solve`);
}

export async function submitSubmission(formData: FormData) {
  const session = await requireRole(Role.STUDENT);
  if (!session.user.studentId) throw new Error("Forbidden");
  const { submissionId, answersJson } = SaveSchema.parse(
    Object.fromEntries(formData.entries()),
  );
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: { include: { worksheet: { include: { exercises: true } } } },
    },
  });
  if (!submission || submission.studentId !== session.user.studentId) {
    throw new Error("Forbidden");
  }
  const answers = safeJsonParse(answersJson, {} as Record<string, unknown>);
  const exercises: ExerciseWithType[] = submission.assignment.worksheet.exercises;

  let autoTotal = 0;
  let maxScore = 0;
  let anyManual = false;

  const answerOps = exercises.map((ex) => {
    const value = (answers[ex.id] ?? {}) as Record<string, unknown>;
    const result = gradeAnswer(
      ex.type as ExerciseType,
      safeJsonParse(ex.payload, {}),
      safeJsonParse(ex.solution, {}),
      value,
      ex.points,
    );
    maxScore += ex.points;
    if (result.autoCorrect === null) anyManual = true;
    else autoTotal += result.autoScore;
    return prisma.answer.upsert({
      where: { submissionId_exerciseId: { submissionId, exerciseId: ex.id } },
      update: {
        value: JSON.stringify(value),
        autoCorrect: result.autoCorrect,
        autoScore: result.autoScore,
      },
      create: {
        submissionId,
        exerciseId: ex.id,
        value: JSON.stringify(value),
        autoCorrect: result.autoCorrect,
        autoScore: result.autoScore,
      },
    });
  });

  const startedAt = submission.startedAt ?? new Date();
  const submittedAt = new Date();
  const timeSpent = Math.max(
    0,
    Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000),
  );

  await prisma.$transaction([
    ...answerOps,
    prisma.submission.update({
      where: { id: submissionId },
      data: {
        submittedAt,
        timeSpentSeconds: timeSpent,
        autoScore: autoTotal,
        manualScore: anyManual ? null : 0,
        finalScore: anyManual ? null : autoTotal,
        maxScore,
        correctionStatus: anyManual ? CorrectionStatus.SUBMITTED : CorrectionStatus.CORRECTED,
      },
    }),
    prisma.assignment.update({
      where: { id: submission.assignmentId },
      data: {
        status: anyManual ? AssignmentStatus.SUBMITTED : AssignmentStatus.CORRECTED,
      },
    }),
  ]);

  // Placement test hook: if the worksheet is the placement test, compute a
  // suggested CEFR level and update the student record.
  if (submission.assignment.worksheet.kind === WorksheetKind.PLACEMENT_TEST) {
    const level = suggestLevel(autoTotal);
    await prisma.student.update({
      where: { id: submission.studentId },
      data: {
        placementStatus: PlacementStatus.COMPLETED,
        placementLevel: level,
        placementScore: autoTotal,
        placementMaxScore: maxScore,
        placementSubmissionId: submissionId,
      },
    });
    revalidatePath(`/students/${submission.studentId}`);
  }

  await audit({
    actorUserId: session.user.id,
    action: "submission.submit",
    entity: "Submission",
    entityId: submissionId,
  });

  redirect("/portal/worksheets");
}

const CorrectSchema = z.object({
  submissionId: z.string(),
  teacherComment: z.string().optional().transform((v) => v || null),
  // dynamic fields: answer.<answerId>.manualScore, .comment
});

export async function saveCorrection(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const submissionId = String(formData.get("submissionId") ?? "");
  CorrectSchema.parse({
    submissionId,
    teacherComment: formData.get("teacherComment"),
  });
  const teacherComment = (formData.get("teacherComment") as string) || null;
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { answers: { include: { exercise: true } } },
  });
  if (!submission) throw new Error("Not found");

  let manualSum = 0;
  let autoSum = 0;
  let maxScore = 0;
  const ops = [];
  for (const ans of submission.answers) {
    const ms = formData.get(`answer.${ans.id}.manualScore`);
    const cm = (formData.get(`answer.${ans.id}.comment`) as string) || null;
    const manualScore = ms != null && ms !== "" ? Number(ms) : null;
    ops.push(
      prisma.answer.update({
        where: { id: ans.id },
        data: { manualScore, teacherComment: cm },
      }),
    );
    maxScore += ans.exercise.points;
    if (ans.autoCorrect != null) autoSum += ans.autoScore ?? 0;
    else if (manualScore != null) manualSum += manualScore;
  }
  await prisma.$transaction([
    ...ops,
    prisma.submission.update({
      where: { id: submissionId },
      data: {
        manualScore: manualSum,
        autoScore: autoSum,
        finalScore: autoSum + manualSum,
        maxScore,
        teacherComment,
        correctionStatus: CorrectionStatus.CORRECTED,
      },
    }),
    prisma.assignment.update({
      where: { id: submission.assignmentId },
      data: { status: AssignmentStatus.CORRECTED },
    }),
  ]);

  await audit({
    actorUserId: session.user.id,
    action: "submission.correct",
    entity: "Submission",
    entityId: submissionId,
  });

  revalidatePath(`/assignments/${submission.assignmentId}`);
  redirect(`/assignments/${submission.assignmentId}`);
}
