"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { createDriveFolder, createDriveDoc } from "@/server/google/drive";
import {
  ensureNotebookFresh,
  parseStudentNotebook,
} from "@/server/notebook/parser";
import { audit } from "@/server/audit/log";

export async function ensureStudentNotebook(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      driveFolderId: true,
      notebookDocId: true,
    },
  });
  if (!student) throw new Error("Student not found");
  if (student.notebookDocId) return;

  let folderId = student.driveFolderId;
  if (!folderId) {
    folderId = await createDriveFolder(
      session.user.id,
      `${student.firstName} ${student.lastName}`,
    );
  }
  const notebook = await createDriveDoc(
    session.user.id,
    `Cuaderno — ${student.firstName} ${student.lastName}`,
    folderId,
  );
  await prisma.student.update({
    where: { id: studentId },
    data: {
      driveFolderId: folderId,
      notebookDocId: notebook.id,
      notebookDocUrl: notebook.webViewLink,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "notebook.create",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
}

export async function refreshStudentNotebook(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  await parseStudentNotebook(session.user.id, studentId);
  await audit({
    actorUserId: session.user.id,
    action: "notebook.parse",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
}

export async function triggerLazyRefresh(studentId: string) {
  const session = await requireRole(Role.TEACHER);
  return ensureNotebookFresh(session.user.id, studentId);
}
