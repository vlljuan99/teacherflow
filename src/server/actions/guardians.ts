"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";

const GuardianSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email().or(z.literal("")).optional().transform((v) => v || null),
  phone: z.string().max(30).optional().transform((v) => v || null),
  relationship: z.string().max(60).optional().transform((v) => v || null),
});

const LinkSchema = z.object({
  guardianId: z.string().min(1),
  studentIds: z.array(z.string()).default([]),
});

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createGuardian(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = GuardianSchema.parse(fd(formData));
  const g = await prisma.guardian.create({ data });
  await audit({
    actorUserId: session.user.id,
    action: "guardian.create",
    entity: "Guardian",
    entityId: g.id,
  });
  revalidatePath("/guardians");
  redirect(`/guardians/${g.id}`);
}

export async function updateGuardian(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = GuardianSchema.parse(fd(formData));
  await prisma.guardian.update({ where: { id }, data });
  await audit({
    actorUserId: session.user.id,
    action: "guardian.update",
    entity: "Guardian",
    entityId: id,
  });
  revalidatePath(`/guardians/${id}`);
  revalidatePath("/guardians");
  redirect(`/guardians/${id}`);
}

export async function deleteGuardian(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.guardian.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "guardian.delete",
    entity: "Guardian",
    entityId: id,
  });
  revalidatePath("/guardians");
  redirect("/guardians");
}

export async function linkGuardianStudents(formData: FormData) {
  await requireRole(Role.TEACHER);
  const guardianId = String(formData.get("guardianId") ?? "");
  const studentIds = formData.getAll("studentIds").map(String);
  const parsed = LinkSchema.parse({ guardianId, studentIds });
  await prisma.$transaction([
    prisma.guardianStudent.deleteMany({ where: { guardianId: parsed.guardianId } }),
    ...(parsed.studentIds.length
      ? [
          prisma.guardianStudent.createMany({
            data: parsed.studentIds.map((sid) => ({
              guardianId: parsed.guardianId,
              studentId: sid,
            })),
          }),
        ]
      : []),
  ]);
  revalidatePath(`/guardians/${parsed.guardianId}`);
}
