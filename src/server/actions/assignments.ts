"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, AssignmentStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";

const AssignmentSchema = z
  .object({
    worksheetId: z.string().min(1),
    studentId: z.string().optional().transform((v) => v || null),
    groupId: z.string().optional().transform((v) => v || null),
    dueAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  })
  .refine(
    (d) => Boolean(d.studentId) !== Boolean(d.groupId),
    "Provide either studentId or groupId, not both",
  );

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createAssignment(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = AssignmentSchema.parse(fd(formData));
  const a = await prisma.assignment.create({
    data: {
      worksheetId: data.worksheetId,
      studentId: data.studentId,
      groupId: data.groupId,
      dueAt: data.dueAt,
      createdById: session.user.id,
      status: AssignmentStatus.PENDING,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "assignment.create",
    entity: "Assignment",
    entityId: a.id,
  });
  revalidatePath("/assignments");
  redirect(`/assignments/${a.id}`);
}

export async function quickAssignHomework(opts: {
  studentId?: string | null;
  groupId?: string | null;
  worksheetId: string;
  dueAt?: string | null;
}) {
  const session = await requireRole(Role.TEACHER);
  if (!opts.studentId && !opts.groupId) {
    throw new Error("Falta alumno o grupo");
  }
  if (opts.studentId && opts.groupId) {
    throw new Error("Solo uno: alumno o grupo");
  }
  const a = await prisma.assignment.create({
    data: {
      worksheetId: opts.worksheetId,
      studentId: opts.studentId ?? null,
      groupId: opts.groupId ?? null,
      dueAt: opts.dueAt ? new Date(opts.dueAt) : null,
      createdById: session.user.id,
      status: AssignmentStatus.PENDING,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "assignment.create",
    entity: "Assignment",
    entityId: a.id,
  });
  revalidatePath("/assignments");
  if (opts.studentId) revalidatePath(`/students/${opts.studentId}`);
  if (opts.groupId) revalidatePath(`/groups/${opts.groupId}`);
}

export async function deleteAssignment(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.assignment.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "assignment.delete",
    entity: "Assignment",
    entityId: id,
  });
  revalidatePath("/assignments");
  redirect("/assignments");
}
