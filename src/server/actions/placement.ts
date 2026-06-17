"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role, WorksheetKind, AssignmentStatus, CorrectionStatus, PlacementStatus } from "@/lib/enums";
import { audit } from "@/server/audit/log";
import {
  PLACEMENT_WORKSHEET_DEFAULTS,
  buildPlacementExercises,
} from "@/server/placement/template";

/**
 * Create the placement test worksheet if it doesn't exist yet.
 * Idempotent — safe to call multiple times.
 */
export async function ensurePlacementTestTemplate(): Promise<string> {
  const session = await requireRole(Role.TEACHER);
  const existing = await prisma.worksheet.findFirst({
    where: { kind: WorksheetKind.PLACEMENT_TEST },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing.id;

  const exercises = buildPlacementExercises();
  const created = await prisma.worksheet.create({
    data: {
      ...PLACEMENT_WORKSHEET_DEFAULTS,
      createdById: session.user.id,
      exercises: { create: exercises },
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.template.create",
    entity: "Worksheet",
    entityId: created.id,
  });
  return created.id;
}

/**
 * Start the placement test for a student.
 * Creates the assignment + submission, marks the student IN_PROGRESS, redirects
 * the teacher to the solver page.
 */
export async function startPlacementTest(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  const worksheetId = await ensurePlacementTestTemplate();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, placementStatus: true },
  });
  if (!student) throw new Error("Student not found");

  // Reuse existing assignment if it exists
  let assignment = await prisma.assignment.findFirst({
    where: { worksheetId, studentId },
  });
  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        worksheetId,
        studentId,
        status: AssignmentStatus.IN_PROGRESS,
        createdById: session.user.id,
      },
    });
  }

  let submission = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId } },
  });
  if (!submission) {
    submission = await prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId,
        correctionStatus: CorrectionStatus.IN_PROGRESS,
      },
    });
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      placementStatus: PlacementStatus.IN_PROGRESS,
      placementSubmissionId: submission.id,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.start",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}/placement?submission=${submission.id}`);
}

export async function skipPlacementTest(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.student.update({
    where: { id: studentId },
    data: { placementStatus: PlacementStatus.SKIPPED },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.skip",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
}

export async function reactivatePlacementTest(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.student.update({
    where: { id: studentId },
    data: {
      placementStatus: PlacementStatus.PENDING,
      placementLevel: null,
      placementScore: null,
      placementMaxScore: null,
      placementSubmissionId: null,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.reactivate",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
}

export async function applySuggestedLevel(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  const s = await prisma.student.findUnique({
    where: { id: studentId },
    select: { placementLevel: true },
  });
  if (!s?.placementLevel) throw new Error("Sin nivel sugerido");
  await prisma.student.update({
    where: { id: studentId },
    data: { level: s.placementLevel },
  });
  await audit({
    actorUserId: session.user.id,
    action: "placement.apply-level",
    entity: "Student",
    entityId: studentId,
    payload: { level: s.placementLevel },
  });
  revalidatePath(`/students/${studentId}`);
}
