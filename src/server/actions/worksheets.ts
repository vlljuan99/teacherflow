"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, EnglishLevel, WorksheetLanguage, WorksheetStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";

const WorksheetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().transform((v) => v || null),
  level: z.nativeEnum(EnglishLevel),
  topic: z.string().max(120).optional().transform((v) => v || null),
  language: z.nativeEnum(WorksheetLanguage),
  status: z.nativeEnum(WorksheetStatus),
});

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createWorksheet(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = WorksheetSchema.parse(fd(formData));
  const w = await prisma.worksheet.create({
    data: { ...data, createdById: session.user.id },
  });
  await audit({
    actorUserId: session.user.id,
    action: "worksheet.create",
    entity: "Worksheet",
    entityId: w.id,
  });
  revalidatePath("/worksheets");
  redirect(`/worksheets/${w.id}/edit`);
}

export async function updateWorksheet(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = WorksheetSchema.parse(fd(formData));
  await prisma.worksheet.update({ where: { id }, data });
  await audit({
    actorUserId: session.user.id,
    action: "worksheet.update",
    entity: "Worksheet",
    entityId: id,
  });
  revalidatePath(`/worksheets/${id}/edit`);
  revalidatePath("/worksheets");
}

export async function deleteWorksheet(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.worksheet.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "worksheet.delete",
    entity: "Worksheet",
    entityId: id,
  });
  revalidatePath("/worksheets");
  redirect("/worksheets");
}

export async function publishWorksheet(id: string) {
  await requireRole(Role.TEACHER);
  await prisma.worksheet.update({
    where: { id },
    data: { status: WorksheetStatus.PUBLISHED },
  });
  revalidatePath(`/worksheets/${id}/edit`);
  revalidatePath("/worksheets");
}

export async function archiveWorksheet(id: string) {
  await requireRole(Role.TEACHER);
  await prisma.worksheet.update({
    where: { id },
    data: { status: WorksheetStatus.ARCHIVED },
  });
  revalidatePath(`/worksheets/${id}/edit`);
  revalidatePath("/worksheets");
}
