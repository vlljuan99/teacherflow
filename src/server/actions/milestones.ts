"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role, EnglishLevel } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";

const MilestoneSchema = z.object({
  level: z.nativeEnum(EnglishLevel),
  title: z.string().min(1).max(120),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((v) => v?.trim() || null),
});

function revalidate() {
  revalidatePath("/settings/odyssey");
  revalidatePath("/portal/dashboard");
}

export async function createMilestone(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = MilestoneSchema.parse(Object.fromEntries(formData.entries()));
  // Append to the end of the level's voyage.
  const last = await prisma.levelMilestone.findFirst({
    where: { level: data.level },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const m = await prisma.levelMilestone.create({
    data: { ...data, order: (last?.order ?? -1) + 1 },
  });
  await audit({
    actorUserId: session.user.id,
    action: "milestone.create",
    entity: "LevelMilestone",
    entityId: m.id,
  });
  revalidate();
}

export async function updateMilestone(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = MilestoneSchema.omit({ level: true }).parse(
    Object.fromEntries(formData.entries()),
  );
  await prisma.levelMilestone.update({ where: { id }, data });
  await audit({
    actorUserId: session.user.id,
    action: "milestone.update",
    entity: "LevelMilestone",
    entityId: id,
  });
  revalidate();
}

export async function deleteMilestone(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.levelMilestone.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "milestone.delete",
    entity: "LevelMilestone",
    entityId: id,
  });
  revalidate();
}

// Swap a milestone's order with its neighbour in the same level.
export async function moveMilestone(id: string, direction: "up" | "down") {
  await requireRole(Role.TEACHER);
  const current = await prisma.levelMilestone.findUnique({ where: { id } });
  if (!current) return;
  const neighbour = await prisma.levelMilestone.findFirst({
    where: {
      level: current.level,
      order: direction === "up" ? { lt: current.order } : { gt: current.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;
  await prisma.$transaction([
    prisma.levelMilestone.update({
      where: { id: current.id },
      data: { order: neighbour.order },
    }),
    prisma.levelMilestone.update({
      where: { id: neighbour.id },
      data: { order: current.order },
    }),
  ]);
  revalidate();
}

// Set (or clear, with "") the student's current position on their level's map.
export async function setStudentMilestone(studentId: string, milestoneId: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.student.update({
    where: { id: studentId },
    data: { currentMilestoneId: milestoneId || null },
  });
  await audit({
    actorUserId: session.user.id,
    action: "student.milestone.set",
    entity: "Student",
    entityId: studentId,
    payload: { milestoneId: milestoneId || null },
  });
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/portal/dashboard");
}
