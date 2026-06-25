"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, EnglishLevel, StudentStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";
import { createDriveFolder, createDriveDoc } from "@/server/google/drive";
import { createMeetSpace } from "@/server/google/meet";
import { saveUploadedFile } from "@/lib/upload";

const StudentSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email().or(z.literal("")).optional().transform((v) => v || null),
  phone: z.string().max(30).optional().transform((v) => (v ? v : null)),
  birthDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  level: z.nativeEnum(EnglishLevel),
  status: z.nativeEnum(StudentStatus),
  groupId: z.string().optional().transform((v) => (v ? v : null)),
  meetLink: z.string().url().or(z.literal("")).optional().transform((v) => v || null),
  isMinor: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  notifyEmail: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  notifyWhatsapp: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  notes: z.string().max(2000).optional().transform((v) => (v ? v : null)),
});

function fd(formData: FormData) {
  const entries = Object.fromEntries(formData.entries());
  // Drop file entries from the schema parse
  delete (entries as Record<string, unknown>).photo;
  return entries;
}

async function extractPhotoUrl(formData: FormData): Promise<string | undefined> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return undefined;
  const saved = await saveUploadedFile(file);
  return `/api/student-photo/${saved.filePath}`;
}

export async function createStudent(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = StudentSchema.parse(fd(formData));
  const photoUrl = await extractPhotoUrl(formData);
  const student = await prisma.student.create({
    data: { ...data, ...(photoUrl ? { photoUrl } : {}) },
  });

  try {
    const folderName = `${data.firstName} ${data.lastName}`;
    const folderId = await createDriveFolder(session.user.id, folderName);
    const notebook = await createDriveDoc(
      session.user.id,
      `Cuaderno — ${data.firstName} ${data.lastName}`,
      folderId,
    );
    await prisma.student.update({
      where: { id: student.id },
      data: {
        driveFolderId: folderId,
        notebookDocId: notebook.id,
        notebookDocUrl: notebook.webViewLink,
      },
    });
  } catch {
    // Google Drive not connected or failed — continue without folder/doc
  }

  await audit({
    actorUserId: session.user.id,
    action: "student.create",
    entity: "Student",
    entityId: student.id,
  });
  revalidatePath("/students");
  redirect(`/students/${student.id}`);
}

export async function updateStudent(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = StudentSchema.parse(fd(formData));
  const photoUrl = await extractPhotoUrl(formData);
  await prisma.student.update({
    where: { id },
    data: { ...data, ...(photoUrl ? { photoUrl } : {}) },
  });
  await audit({
    actorUserId: session.user.id,
    action: "student.update",
    entity: "Student",
    entityId: id,
  });
  revalidatePath(`/students/${id}`);
  revalidatePath("/students");
  redirect(`/students/${id}`);
}

export async function generateMeetForNewStudent(): Promise<string> {
  const session = await requireRole(Role.TEACHER);
  return createMeetSpace(session.user.id);
}

export async function assignMeetToStudent(studentId: string): Promise<string> {
  const session = await requireRole(Role.TEACHER);
  const url = await createMeetSpace(session.user.id);
  await prisma.student.update({
    where: { id: studentId },
    data: { meetLink: url },
  });
  await audit({
    actorUserId: session.user.id,
    action: "student.meet.create",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
  return url;
}

export async function deleteStudent(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.student.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "student.delete",
    entity: "Student",
    entityId: id,
  });
  revalidatePath("/students");
  redirect("/students");
}
