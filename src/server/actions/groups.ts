"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, EnglishLevel } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";

const GroupSchema = z.object({
  name: z.string().min(1).max(120),
  level: z.nativeEnum(EnglishLevel),
  description: z.string().max(1000).optional().transform((v) => v || null),
  schedule: z.string().max(200).optional().transform((v) => v || null),
});

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createGroup(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = GroupSchema.parse(fd(formData));
  const g = await prisma.group.create({ data });
  await audit({
    actorUserId: session.user.id,
    action: "group.create",
    entity: "Group",
    entityId: g.id,
  });
  revalidatePath("/groups");
  redirect(`/groups/${g.id}`);
}

export async function updateGroup(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = GroupSchema.parse(fd(formData));
  await prisma.group.update({ where: { id }, data });
  await audit({
    actorUserId: session.user.id,
    action: "group.update",
    entity: "Group",
    entityId: id,
  });
  revalidatePath(`/groups/${id}`);
  revalidatePath("/groups");
  redirect(`/groups/${id}`);
}

export async function deleteGroup(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.group.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "group.delete",
    entity: "Group",
    entityId: id,
  });
  revalidatePath("/groups");
  redirect("/groups");
}
