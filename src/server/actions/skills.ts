"use server";

import { revalidatePath } from "next/cache";
import { Role, Skill, SkillSubmissionStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { storeUploadedFile, removeStored } from "@/lib/storage";
import { audit } from "@/server/audit/log";

const PORTAL_PATH: Record<string, string> = {
  SPEAKING: "/portal/speaking",
  WRITING: "/portal/writing",
};

// Student uploads an audio (speaking) or a file/text (writing) for review.
export async function submitSkill(skill: Skill, formData: FormData) {
  const session = await requireRole(Role.STUDENT);
  const studentId = session.user.studentId;
  if (!studentId) throw new Error("No student profile");

  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim() || null;
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && !text) {
    throw new Error("Adjunta un archivo o escribe tu respuesta");
  }
  // Speaking always needs an audio file.
  if (skill === Skill.SPEAKING && !hasFile) {
    throw new Error("Sube un archivo de audio");
  }

  const saved = hasFile
    ? await storeUploadedFile(file, { prefix: `skills/${skill.toLowerCase()}` })
    : null;

  const created = await prisma.skillSubmission.create({
    data: {
      skill,
      studentId,
      title: title || (saved?.originalName ?? "—"),
      text,
      filePath: saved?.filePath ?? null,
      storage: saved?.storage ?? null,
      blobName: saved?.blobName ?? null,
      mime: saved?.mime ?? null,
      size: saved?.size ?? null,
      originalName: saved?.originalName ?? null,
      status: SkillSubmissionStatus.SUBMITTED,
    },
  });

  await audit({
    actorUserId: session.user.id,
    action: "skill.submit",
    entity: "SkillSubmission",
    entityId: created.id,
  });
  revalidatePath(PORTAL_PATH[skill] ?? "/portal/dashboard");
  revalidatePath("/submissions");
}

// Teacher reviews: score + comment, marks as reviewed.
export async function reviewSkill(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const scoreRaw = formData.get("score");
  const maxRaw = formData.get("maxScore");
  const comment = String(formData.get("teacherComment") ?? "").trim() || null;
  const score =
    typeof scoreRaw === "string" && scoreRaw.trim() !== ""
      ? Number(scoreRaw)
      : null;
  const maxScore =
    typeof maxRaw === "string" && maxRaw.trim() !== "" ? Number(maxRaw) : null;

  await prisma.skillSubmission.update({
    where: { id },
    data: {
      score: Number.isFinite(score) ? score : null,
      maxScore: Number.isFinite(maxScore) ? maxScore : null,
      teacherComment: comment,
      status: SkillSubmissionStatus.REVIEWED,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "skill.review",
    entity: "SkillSubmission",
    entityId: id,
  });
  revalidatePath("/submissions");
}

export async function deleteSkillSubmission(id: string) {
  const session = await requireRole(Role.STUDENT);
  const sub = await prisma.skillSubmission.findUnique({
    where: { id },
    select: {
      studentId: true,
      skill: true,
      storage: true,
      blobName: true,
      filePath: true,
    },
  });
  if (!sub || sub.studentId !== session.user.studentId) {
    throw new Error("Not allowed");
  }
  await prisma.skillSubmission.delete({ where: { id } });
  if (sub.filePath) {
    await removeStored({
      storage: sub.storage ?? "local",
      blobName: sub.blobName,
      filePath: sub.filePath,
    }).catch(() => {});
  }
  revalidatePath(PORTAL_PATH[sub.skill] ?? "/portal/dashboard");
}
