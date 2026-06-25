"use server";

import { revalidatePath } from "next/cache";
import { Role, AttendanceStatus } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";

const VALID_STATUS = new Set<string>(Object.values(AttendanceStatus));

// Roster for a class: the single student, or every student in its group.
async function classRoster(classId: string): Promise<string[]> {
  const klass = await prisma.class.findUnique({
    where: { id: classId },
    select: { studentId: true, groupId: true },
  });
  if (!klass) return [];
  if (klass.studentId) return [klass.studentId];
  if (klass.groupId) {
    const rows = await prisma.student.findMany({
      where: { groupId: klass.groupId },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
  return [];
}

export async function saveClassAttendance(classId: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const roster = await classRoster(classId);
  for (const studentId of roster) {
    const rawStatus = formData.get(`status_${studentId}`);
    if (typeof rawStatus !== "string" || !VALID_STATUS.has(rawStatus)) continue;
    const rawNote = formData.get(`note_${studentId}`);
    const note =
      typeof rawNote === "string" && rawNote.trim() ? rawNote.trim() : null;
    await prisma.attendance.upsert({
      where: { classId_studentId: { classId, studentId } },
      create: { classId, studentId, status: rawStatus, note },
      update: { status: rawStatus, note },
    });
  }
  await audit({
    actorUserId: session.user.id,
    action: "attendance.save",
    entity: "Class",
    entityId: classId,
  });
  revalidatePath(`/classes/${classId}`);
  revalidatePath(`/attendance`);
}
