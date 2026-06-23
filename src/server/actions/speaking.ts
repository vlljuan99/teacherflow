"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import {
  Role,
  EnglishLevel,
  MaterialTrack,
  SpeakingTwist,
} from "@/lib/enums";
import { audit } from "@/server/audit/log";

const optionalString = (v: FormDataEntryValue | null) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;

const Schema = z.object({
  prompt: z.string().min(3).max(800),
  level: z.nativeEnum(EnglishLevel).optional().nullable(),
  track: z.nativeEnum(MaterialTrack).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  points: z.coerce.number().int().min(1).max(50).default(1),
  twist: z.nativeEnum(SpeakingTwist).optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});

export async function createSpeakingQuestion(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = Schema.parse({
    prompt: formData.get("prompt"),
    level: optionalString(formData.get("level")),
    track: optionalString(formData.get("track")),
    category: optionalString(formData.get("category")),
    points: formData.get("points") ?? 1,
    twist: optionalString(formData.get("twist")),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  const q = await prisma.speakingQuestion.create({
    data: {
      prompt: data.prompt,
      level: data.level ?? null,
      track: data.track ?? null,
      category: data.category ?? null,
      points: data.points,
      twist: data.twist ?? null,
      isActive: data.isActive,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "speaking.create",
    entity: "SpeakingQuestion",
    entityId: q.id,
  });
  revalidatePath("/settings/speaking");
  redirect("/settings/speaking");
}

export async function updateSpeakingQuestion(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = Schema.parse({
    prompt: formData.get("prompt"),
    level: optionalString(formData.get("level")),
    track: optionalString(formData.get("track")),
    category: optionalString(formData.get("category")),
    points: formData.get("points") ?? 1,
    twist: optionalString(formData.get("twist")),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  await prisma.speakingQuestion.update({
    where: { id },
    data: {
      prompt: data.prompt,
      level: data.level ?? null,
      track: data.track ?? null,
      category: data.category ?? null,
      points: data.points,
      twist: data.twist ?? null,
      isActive: data.isActive,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "speaking.update",
    entity: "SpeakingQuestion",
    entityId: id,
  });
  revalidatePath("/settings/speaking");
  redirect("/settings/speaking");
}

export async function deleteSpeakingQuestion(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.speakingQuestion.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "speaking.delete",
    entity: "SpeakingQuestion",
    entityId: id,
  });
  revalidatePath("/settings/speaking");
}
