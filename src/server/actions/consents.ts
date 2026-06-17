"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, ConsentType, ConsentStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";
import { headers } from "next/headers";

const ConsentSchema = z
  .object({
    studentId: z.string().optional().transform((v) => v || null),
    guardianId: z.string().optional().transform((v) => v || null),
    type: z.nativeEnum(ConsentType),
    version: z.string().min(1).max(20),
    text: z.string().min(1).max(8000),
    acceptedByName: z.string().min(1).max(200),
  })
  .refine(
    (d) => Boolean(d.studentId) || Boolean(d.guardianId),
    "Either studentId or guardianId is required",
  );

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createConsent(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const d = ConsentSchema.parse(fd(formData));
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const c = await prisma.consent.create({
    data: {
      studentId: d.studentId,
      guardianId: d.guardianId,
      type: d.type,
      version: d.version,
      text: d.text,
      acceptedByName: d.acceptedByName,
      ip,
      status: ConsentStatus.ACCEPTED,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "consent.accept",
    entity: "Consent",
    entityId: c.id,
  });
  revalidatePath("/consents");
  redirect(`/consents/${c.id}`);
}

export async function revokeConsent(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.consent.update({
    where: { id },
    data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
  });
  await audit({
    actorUserId: session.user.id,
    action: "consent.revoke",
    entity: "Consent",
    entityId: id,
  });
  revalidatePath("/consents");
  revalidatePath(`/consents/${id}`);
}

export async function deleteConsent(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.consent.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "consent.delete",
    entity: "Consent",
    entityId: id,
  });
  revalidatePath("/consents");
  redirect("/consents");
}
