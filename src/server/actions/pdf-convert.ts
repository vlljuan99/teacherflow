"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, WorksheetStatus, EnglishLevel } from "@/lib/enums";
import { requireRole } from "@/server/auth/session";
import { prisma } from "@/lib/db";
import { audit } from "@/server/audit/log";
import { readStoredBytes } from "@/lib/storage";
import {
  extractExercisesFromPdf,
  toExerciseRow,
  type ExtractedWorksheet,
} from "@/server/ai/extract-exercises";

/**
 * Convert a Material PDF into a draft Worksheet with Exercises.
 *
 * If a draft worksheet for this material already exists (linked via
 * PdfImport), we return it instead of re-running Gemini. This makes the
 * "Convertir a ficha" button idempotent and safe to retry.
 *
 * Always lands in WorksheetStatus.DRAFT — the teacher reviews the result on
 * /worksheets/[id]/review and explicitly publishes.
 */
export async function convertPdfToWorksheet(materialId: string): Promise<void> {
  const session = await requireRole(Role.TEACHER);
  const teacherId = session.user.id;

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      title: true,
      type: true,
      mime: true,
      storage: true,
      blobName: true,
      filePath: true,
      level: true,
      examType: true,
      pdfImport: { select: { worksheetId: true } },
    },
  });
  if (!material) throw new Error("Material no encontrado");
  if (material.type !== "PDF" && material.mime !== "application/pdf") {
    throw new Error("Solo se pueden convertir materiales PDF");
  }

  // Idempotency: reuse existing draft if any.
  if (material.pdfImport?.worksheetId) {
    redirect(`/worksheets/${material.pdfImport.worksheetId}/review`);
  }

  // Fetch bytes + extract
  const pdfBytes = await readStoredBytes(material);
  const extracted: ExtractedWorksheet = await extractExercisesFromPdf(pdfBytes);

  // Persist: Worksheet + Exercises + PdfImport link, all in one transaction.
  const worksheet = await prisma.$transaction(async (tx) => {
    const ws = await tx.worksheet.create({
      data: {
        title: extracted.title || material.title,
        description: extracted.description ?? null,
        level: levelFallback(extracted.level, material.level),
        topic: extracted.examType ?? material.examType ?? null,
        language: extracted.language ?? "EN",
        status: WorksheetStatus.DRAFT,
        createdById: teacherId,
      },
    });

    // Flatten all exercises across sections, preserving section title in the
    // exercise prompt (we don't have a Section model, just an order index).
    let order = 0;
    const rows: ReturnType<typeof toExerciseRow>[] = [];
    for (const section of extracted.sections) {
      for (const ex of section.exercises) {
        const row = toExerciseRow(
          {
            ...ex,
            // Prefix prompt with section so the review screen can group.
            prompt: ex.prompt,
          },
          order++,
        );
        if (row) {
          rows.push({
            ...row,
            // Stash section title in the payload meta for the review UI to
            // group by. (Adding a Section model would be cleaner but not in
            // scope for this iteration.)
            payload: addSectionTag(row.payload, section.title),
          });
        }
      }
    }

    if (rows.length > 0) {
      await tx.exercise.createMany({
        data: rows.map((r) => ({
          worksheetId: ws.id,
          type: r.type,
          order: r.order,
          prompt: r.prompt,
          payload: r.payload,
          solution: r.solution,
          points: r.points,
        })),
      });
    }

    await tx.pdfImport.create({
      data: {
        materialId: material.id,
        worksheetId: ws.id,
        status: "PROCESSED",
      },
    });

    return ws;
  });

  await audit({
    actorUserId: teacherId,
    action: "worksheet.pdf.convert",
    entity: "Worksheet",
    entityId: worksheet.id,
    payload: {
      materialId: material.id,
      totalExercises: extracted.sections.reduce((n, s) => n + s.exercises.length, 0),
    },
  });

  revalidatePath("/worksheets");
  revalidatePath(`/materials/${material.id}`);
  redirect(`/worksheets/${worksheet.id}/review`);
}

function levelFallback(
  extracted: string | undefined,
  fromMaterial: string | null,
): string {
  if (extracted && (Object.values(EnglishLevel) as string[]).includes(extracted)) {
    return extracted;
  }
  if (fromMaterial && (Object.values(EnglishLevel) as string[]).includes(fromMaterial)) {
    return fromMaterial;
  }
  return EnglishLevel.B1;
}

function addSectionTag(payloadJson: string, sectionTitle: string): string {
  try {
    const obj = JSON.parse(payloadJson) as Record<string, unknown>;
    const meta = (obj._extraction as Record<string, unknown> | undefined) ?? {};
    obj._extraction = { ...meta, section: sectionTitle };
    return JSON.stringify(obj);
  } catch {
    return payloadJson;
  }
}
