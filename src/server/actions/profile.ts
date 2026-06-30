"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

const PasswordSchema = z.object({
  currentPassword: z.string().optional().transform((v) => v ?? ""),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function changePassword(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const parsed = PasswordSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) redirect("/profile?pw=short");
  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) redirect("/profile?pw=mismatch");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  // If the account already has a password, the current one must match.
  if (user?.passwordHash) {
    const ok =
      currentPassword.length > 0 &&
      (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!ok) redirect("/profile?pw=bad");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });
  await audit({
    actorUserId: session.user.id,
    action: "profile.password.change",
    entity: "User",
    entityId: session.user.id,
  });
  redirect("/profile?pw=ok");
}
