"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MaterialType,
  Role,
  EnglishLevel,
  ExamType,
  MaterialCategory,
} from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { storeUploadedFile, removeStored } from "@/lib/storage";
import { audit } from "@/server/audit/log";

function detectMaterialType(mime: string): MaterialType {
  if (mime.startsWith("image/")) return MaterialType.IMAGE;
  if (mime.startsWith("audio/")) return MaterialType.AUDIO;
  if (mime === "application/pdf") return MaterialType.PDF;
  return MaterialType.DOCUMENT;
}

const optionalString = (v: FormDataEntryValue | null) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;

const UploadSchema = z.object({
  title: z.string().min(1).max(200),
  worksheetId: z.string().optional().transform((v) => v || null),
  level: z.nativeEnum(EnglishLevel).optional().nullable(),
  examType: z.nativeEnum(ExamType).optional().nullable(),
  category: z.nativeEnum(MaterialCategory).default(MaterialCategory.OTHER),
});

export async function createMaterial(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file");
  }
  const meta = UploadSchema.parse({
    title: formData.get("title"),
    worksheetId: formData.get("worksheetId"),
    level: optionalString(formData.get("level")),
    examType: optionalString(formData.get("examType")),
    category: optionalString(formData.get("category")) ?? MaterialCategory.OTHER,
  });
  const saved = await storeUploadedFile(file, { prefix: "materials" });
  const type = detectMaterialType(saved.mime);
  const m = await prisma.material.create({
    data: {
      title: meta.title || saved.originalName,
      type,
      filePath: saved.filePath,
      size: saved.size,
      mime: saved.mime,
      originalName: saved.originalName,
      storage: saved.storage,
      blobName: saved.blobName,
      level: meta.level ?? null,
      examType: meta.examType ?? null,
      category: meta.category,
      uploadedById: session.user.id,
    },
  });
  if (meta.worksheetId) {
    await prisma.materialLink.create({
      data: {
        materialId: m.id,
        worksheetId: meta.worksheetId,
      },
    });
  }
  await audit({
    actorUserId: session.user.id,
    action: "material.create",
    entity: "Material",
    entityId: m.id,
  });
  revalidatePath("/materials");
  redirect(`/materials`);
}

export async function deleteMaterial(id: string) {
  const session = await requireRole(Role.TEACHER);
  const m = await prisma.material.findUnique({
    where: { id },
    select: { storage: true, blobName: true, filePath: true },
  });
  await prisma.material.delete({ where: { id } });
  if (m) {
    await removeStored({
      storage: m.storage,
      blobName: m.blobName,
      filePath: m.filePath,
    }).catch(() => {
      /* swallow */
    });
  }
  await audit({
    actorUserId: session.user.id,
    action: "material.delete",
    entity: "Material",
    entityId: id,
  });
  revalidatePath("/materials");
  redirect("/materials");
}
