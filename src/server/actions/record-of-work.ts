"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";

const RecordSchema = z.object({
  warmUp: z.string().max(2000).optional().transform((v) => v?.trim() || null),
  mainTask: z.string().max(2000).optional().transform((v) => v?.trim() || null),
  homework: z.string().max(2000).optional().transform((v) => v?.trim() || null),
  notes: z.string().max(2000).optional().transform((v) => v?.trim() || null),
});

export async function saveRecordOfWork(classId: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = RecordSchema.parse(Object.fromEntries(formData.entries()));
  await prisma.recordOfWork.upsert({
    where: { classId },
    create: { classId, ...data },
    update: data,
  });
  await audit({
    actorUserId: session.user.id,
    action: "recordOfWork.save",
    entity: "Class",
    entityId: classId,
  });
  revalidatePath(`/classes/${classId}`);
}
