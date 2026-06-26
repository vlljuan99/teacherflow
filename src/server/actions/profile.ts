"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";
import { saveUploadedFile } from "@/lib/upload";

const ProfileSchema = z.object({
  contactEmail: z
    .string()
    .email()
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  contactPhone: z.string().max(40).optional().transform((v) => (v ? v : null)),
  contactWhatsapp: z
    .string()
    .max(40)
    .optional()
    .transform((v) => (v ? v : null)),
  contactNote: z.string().max(2000).optional().transform((v) => (v ? v : null)),
});

export async function updateProfile(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const entries = Object.fromEntries(formData.entries());
  delete (entries as Record<string, unknown>).photo;
  const data = ProfileSchema.parse(entries);

  let photoUrl: string | undefined;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file);
    photoUrl = `/api/student-photo/${saved.filePath}`;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...data, ...(photoUrl ? { photoUrl } : {}) },
  });
  await audit({
    actorUserId: session.user.id,
    action: "profile.update",
    entity: "User",
    entityId: session.user.id,
  });
  revalidatePath("/profile");
}
