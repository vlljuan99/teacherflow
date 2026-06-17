"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MaterialType, Role } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { saveUploadedFile } from "@/lib/upload";
import { audit } from "@/server/audit/log";

function detectMaterialType(mime: string): MaterialType {
  if (mime.startsWith("image/")) return MaterialType.IMAGE;
  if (mime.startsWith("audio/")) return MaterialType.AUDIO;
  if (mime === "application/pdf") return MaterialType.PDF;
  return MaterialType.DOCUMENT;
}

const UploadSchema = z.object({
  title: z.string().min(1).max(200),
  worksheetId: z.string().optional().transform((v) => v || null),
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
  });
  const saved = await saveUploadedFile(file);
  const type = detectMaterialType(saved.mime);
  const m = await prisma.material.create({
    data: {
      title: meta.title || saved.originalName,
      type,
      filePath: saved.filePath,
      size: saved.size,
      mime: saved.mime,
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
  await prisma.material.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "material.delete",
    entity: "Material",
    entityId: id,
  });
  revalidatePath("/materials");
  redirect("/materials");
}
