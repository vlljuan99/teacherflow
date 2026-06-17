"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ExerciseType, Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";

const ExerciseSchema = z.object({
  worksheetId: z.string().min(1),
  type: z.nativeEnum(ExerciseType),
  prompt: z.string().min(1).max(2000),
  points: z.coerce.number().int().min(0).max(100).default(1),
  payload: z.string().refine(
    (v) => { try { JSON.parse(v); return true; } catch { return false; } },
    "Invalid payload JSON",
  ),
  solution: z.string().refine(
    (v) => { try { JSON.parse(v); return true; } catch { return false; } },
    "Invalid solution JSON",
  ),
});

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function addExercise(formData: FormData) {
  await requireRole(Role.TEACHER);
  const data = ExerciseSchema.parse(fd(formData));
  const count = await prisma.exercise.count({ where: { worksheetId: data.worksheetId } });
  await prisma.exercise.create({
    data: {
      worksheetId: data.worksheetId,
      type: data.type,
      prompt: data.prompt,
      points: data.points,
      payload: data.payload,
      solution: data.solution,
      order: count,
    },
  });
  revalidatePath(`/worksheets/${data.worksheetId}/edit`);
  revalidatePath(`/worksheets/${data.worksheetId}`);
}

export async function updateExercise(id: string, formData: FormData) {
  await requireRole(Role.TEACHER);
  const data = ExerciseSchema.parse(fd(formData));
  await prisma.exercise.update({
    where: { id },
    data: {
      type: data.type,
      prompt: data.prompt,
      points: data.points,
      payload: data.payload,
      solution: data.solution,
    },
  });
  revalidatePath(`/worksheets/${data.worksheetId}/edit`);
  revalidatePath(`/worksheets/${data.worksheetId}`);
}

export async function deleteExercise(exerciseId: string, worksheetId: string) {
  await requireRole(Role.TEACHER);
  await prisma.exercise.delete({ where: { id: exerciseId } });
  // Reorder remaining
  const remaining = await prisma.exercise.findMany({
    where: { worksheetId },
    orderBy: { order: "asc" },
  });
  await prisma.$transaction(
    remaining.map((e, idx) =>
      prisma.exercise.update({ where: { id: e.id }, data: { order: idx } }),
    ),
  );
  revalidatePath(`/worksheets/${worksheetId}/edit`);
  revalidatePath(`/worksheets/${worksheetId}`);
}

export async function moveExercise(
  exerciseId: string,
  worksheetId: string,
  direction: "up" | "down",
) {
  await requireRole(Role.TEACHER);
  const exercises = await prisma.exercise.findMany({
    where: { worksheetId },
    orderBy: { order: "asc" },
  });
  const idx = exercises.findIndex((e) => e.id === exerciseId);
  if (idx < 0) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= exercises.length) return;
  const a = exercises[idx];
  const b = exercises[swap];
  await prisma.$transaction([
    prisma.exercise.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.exercise.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidatePath(`/worksheets/${worksheetId}/edit`);
}
