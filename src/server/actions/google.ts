"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { createMeetEvent, deleteMeetEvent } from "@/server/google/calendar";
import { audit } from "@/server/audit/log";

export async function disconnectGoogleCalendar() {
  const session = await requireRole(Role.TEACHER);
  await prisma.googleAccount.deleteMany({ where: { userId: session.user.id } });
  await audit({
    actorUserId: session.user.id,
    action: "google.calendar.disconnect",
    entity: "GoogleAccount",
  });
  revalidatePath("/dashboard");
}

export async function generateMeetForClass(classId: string) {
  const session = await requireRole(Role.TEACHER);
  const klass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      student: { select: { email: true } },
      group: { include: { students: { select: { email: true } } } },
    },
  });
  if (!klass) throw new Error("Not found");
  const attendees = [
    klass.student?.email,
    ...(klass.group?.students.map((s) => s.email) ?? []),
  ].filter((e): e is string => Boolean(e));
  const event = await createMeetEvent({
    teacherUserId: session.user.id,
    title: klass.title,
    description: klass.notes ?? undefined,
    startAt: klass.startAt,
    endAt: klass.endAt,
    attendees,
  });
  await prisma.class.update({
    where: { id: classId },
    data: {
      meetLink: event.hangoutLink,
      googleEventId: event.id,
      location: event.hangoutLink ?? klass.location,
    },
  });
  await audit({
    actorUserId: session.user.id,
    action: "class.meet.generate",
    entity: "Class",
    entityId: classId,
  });
  revalidatePath(`/classes/${classId}`);
  revalidatePath("/classes");
}

export async function removeMeetForClass(classId: string) {
  const session = await requireRole(Role.TEACHER);
  const klass = await prisma.class.findUnique({ where: { id: classId } });
  if (!klass || !klass.googleEventId) return;
  try {
    await deleteMeetEvent(session.user.id, klass.googleEventId);
  } catch (err) {
    console.error("removeMeetForClass", err);
  }
  await prisma.class.update({
    where: { id: classId },
    data: { meetLink: null, googleEventId: null },
  });
  await audit({
    actorUserId: session.user.id,
    action: "class.meet.remove",
    entity: "Class",
    entityId: classId,
  });
  revalidatePath(`/classes/${classId}`);
  revalidatePath("/classes");
}
