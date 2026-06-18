"use server";

import { revalidatePath } from "next/cache";
import { Role, MaterialType } from "@/lib/enums";
import { requireRole } from "@/server/auth/session";
import { prisma } from "@/lib/db";
import { audit } from "@/server/audit/log";
import { storeBuffer } from "@/lib/storage";
import {
  listCourses,
  listTopics,
  listCourseWorkMaterial,
  type ClassroomCourse,
} from "@/server/google/classroom";
import {
  getDriveFileMeta,
  downloadDriveFile,
  exportDriveFile,
} from "@/server/google/drive";
import { inferTaxonomy } from "@/server/google/classroom-taxonomy";

function detectMaterialType(mime: string): MaterialType {
  if (mime.startsWith("image/")) return MaterialType.IMAGE;
  if (mime.startsWith("audio/")) return MaterialType.AUDIO;
  if (mime === "application/pdf") return MaterialType.PDF;
  return MaterialType.DOCUMENT;
}

// Google-native MIME → export format we'll persist.
const GOOGLE_EXPORTS: Record<string, { mime: string; ext: string }> = {
  "application/vnd.google-apps.document": { mime: "application/pdf", ext: ".pdf" },
  "application/vnd.google-apps.presentation": { mime: "application/pdf", ext: ".pdf" },
  "application/vnd.google-apps.spreadsheet": {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: ".xlsx",
  },
  "application/vnd.google-apps.drawing": { mime: "image/png", ext: ".png" },
};

export interface ImportPreview {
  courseId: string;
  courseName: string;
  topics: Record<string, string>; // topicId -> name
  materials: Array<{
    id: string;
    title: string;
    topicId?: string;
    topicName?: string;
    driveFiles: Array<{ id: string; title?: string }>;
  }>;
  totalDriveFiles: number;
}

export async function listClassroomCoursesAction(): Promise<ClassroomCourse[]> {
  const session = await requireRole(Role.TEACHER);
  return listCourses(session.user.id);
}

export async function previewClassroomImport(courseId: string): Promise<ImportPreview> {
  const session = await requireRole(Role.TEACHER);
  const userId = session.user.id;
  const [topics, materials, courses] = await Promise.all([
    listTopics(userId, courseId),
    listCourseWorkMaterial(userId, courseId),
    listCourses(userId),
  ]);
  const course = courses.find((c) => c.id === courseId);
  const topicMap: Record<string, string> = {};
  for (const tp of topics) topicMap[tp.topicId] = tp.name;

  let total = 0;
  const mapped = materials.map((m) => {
    const driveFiles: Array<{ id: string; title?: string }> = [];
    for (const att of m.materials ?? []) {
      const df = att.driveFile?.driveFile;
      if (df?.id) {
        driveFiles.push({ id: df.id, title: df.title });
        total++;
      }
    }
    return {
      id: m.id,
      title: m.title ?? "(sin título)",
      topicId: m.topicId,
      topicName: m.topicId ? topicMap[m.topicId] : undefined,
      driveFiles,
    };
  });

  return {
    courseId,
    courseName: course?.name ?? courseId,
    topics: topicMap,
    materials: mapped,
    totalDriveFiles: total,
  };
}

export interface ImportResult {
  importedFiles: number;
  importedMaterials: number;
  skipped: number;
  errors: Array<{ materialId: string; driveFileId: string; error: string }>;
}

export async function runClassroomImport(courseId: string): Promise<ImportResult> {
  const session = await requireRole(Role.TEACHER);
  const userId = session.user.id;
  const [topics, materials] = await Promise.all([
    listTopics(userId, courseId),
    listCourseWorkMaterial(userId, courseId),
  ]);
  const topicMap: Record<string, string> = {};
  for (const tp of topics) topicMap[tp.topicId] = tp.name;

  const result: ImportResult = {
    importedFiles: 0,
    importedMaterials: 0,
    skipped: 0,
    errors: [],
  };

  for (const m of materials) {
    const topicName = m.topicId ? topicMap[m.topicId] : undefined;
    const tax = inferTaxonomy(topicName);
    let createdAny = false;
    for (const att of m.materials ?? []) {
      const df = att.driveFile?.driveFile;
      if (!df?.id) continue;

      const existing = await prisma.material.findFirst({
        where: { sourceUrl: `drive:${df.id}` },
        select: { id: true },
      });
      if (existing) {
        result.skipped++;
        continue;
      }

      try {
        const meta = await getDriveFileMeta(userId, df.id);
        if (!meta) {
          result.errors.push({ materialId: m.id, driveFileId: df.id, error: "Drive file not found" });
          continue;
        }

        let payload: { buffer: Buffer; mime: string };
        let filename = meta.name;
        const exportMap = GOOGLE_EXPORTS[meta.mimeType];
        if (exportMap) {
          payload = await exportDriveFile(userId, df.id, exportMap.mime);
          filename = meta.name + exportMap.ext;
        } else {
          payload = await downloadDriveFile(userId, df.id);
        }

        const stored = await storeBuffer({
          buffer: payload.buffer,
          filename,
          mime: payload.mime,
          prefix: "materials/classroom",
        });
        await prisma.material.create({
          data: {
            title: df.title ?? m.title ?? filename,
            type: detectMaterialType(stored.mime),
            filePath: stored.filePath,
            size: stored.size,
            mime: stored.mime,
            originalName: filename,
            storage: stored.storage,
            blobName: stored.blobName,
            level: tax.level,
            examType: tax.examType,
            category: tax.category,
            sourceUrl: `drive:${df.id}`,
            sourceTopic: topicName ?? null,
            uploadedById: userId,
          },
        });
        result.importedFiles++;
        createdAny = true;
      } catch (err) {
        result.errors.push({
          materialId: m.id,
          driveFileId: df.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    if (createdAny) result.importedMaterials++;
  }

  await audit({
    actorUserId: userId,
    action: "material.classroom.import",
    entity: "Course",
    entityId: courseId,
    payload: { courseId, ...result },
  });

  revalidatePath("/materials");
  return result;
}
