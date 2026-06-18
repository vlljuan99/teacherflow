"use server";

import { z } from "zod";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, ClassModality } from "@/lib/enums";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/audit/log";
import { createDriveFolder, createDriveDoc } from "@/server/google/drive";
import { buildAutoTitle } from "@/server/classes/title";
import {
  generateRecurrenceDates,
  describeRecurrence,
  type IsoWeekday,
} from "@/server/classes/recurrence";
import { randomUUID } from "node:crypto";
import { inMadrid, parseMadridDateTime } from "@/lib/timezone";

const ClassSchema = z
  .object({
    title: z.string().min(1).max(200),
    titleAuto: z
      .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
      .optional()
      .transform((v) => v !== "false"),
    startAt: z.string().transform(parseMadridDateTime),
    endAt: z.string().transform(parseMadridDateTime),
    modality: z.nativeEnum(ClassModality),
    location: z.string().max(200).optional().transform((v) => v || null),
    groupId: z.string().optional().transform((v) => v || null),
    studentId: z.string().optional().transform((v) => v || null),
    notes: z.string().max(2000).optional().transform((v) => v || null),
  })
  .refine((d) => d.endAt > d.startAt, "endAt must be after startAt");

function parseFields(formData: FormData) {
  const entries = Object.fromEntries(formData.entries());
  delete (entries as Record<string, unknown>).worksheetIds;
  delete (entries as Record<string, unknown>).materialIds;
  delete (entries as Record<string, unknown>)._track_start;
  delete (entries as Record<string, unknown>).repeat;
  delete (entries as Record<string, unknown>).weekdays;
  delete (entries as Record<string, unknown>).untilDate;
  return entries;
}

function parseRecurrence(formData: FormData): {
  weekdays: IsoWeekday[];
  untilDate: Date;
} | null {
  if (formData.get("repeat") !== "true") return null;
  const wdRaw = String(formData.get("weekdays") ?? "");
  const weekdays = wdRaw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n): n is IsoWeekday => n >= 1 && n <= 7) as IsoWeekday[];
  if (weekdays.length === 0) return null;
  const untilStr = String(formData.get("untilDate") ?? "");
  const untilDate = new Date(untilStr);
  if (isNaN(untilDate.getTime())) return null;
  return { weekdays, untilDate };
}

function getAttachmentIds(formData: FormData): {
  worksheetIds: string[];
  materialIds: string[];
} {
  const worksheetIds = formData.getAll("worksheetIds").map(String).filter(Boolean);
  const materialIds = formData.getAll("materialIds").map(String).filter(Boolean);
  return { worksheetIds, materialIds };
}

export async function createClass(formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = ClassSchema.parse(parseFields(formData));
  const { worksheetIds, materialIds } = getAttachmentIds(formData);
  const recurrence = parseRecurrence(formData);

  // Inherit Meet link from the student's permanent link if online.
  let meetLink: string | null = null;
  if (data.modality === ClassModality.ONLINE && data.studentId) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { meetLink: true },
    });
    meetLink = student?.meetLink ?? null;
  }

  // --- Recurrence path: create N classes, skip Drive doc per class to avoid
  // hammering the API. Series share a seriesId so they can be operated as one.
  if (recurrence) {
    const dates = generateRecurrenceDates(data.startAt, recurrence);
    const duration = data.endAt.getTime() - data.startAt.getTime();
    const seriesId = randomUUID();
    const seriesNote = describeRecurrence(recurrence.weekdays, recurrence.untilDate);

    let studentName: string | null = null;
    let groupName: string | null = null;
    if (data.titleAuto) {
      if (data.studentId) {
        const s = await prisma.student.findUnique({
          where: { id: data.studentId },
          select: { firstName: true },
        });
        studentName = s?.firstName ?? null;
      }
      if (data.groupId) {
        const g = await prisma.group.findUnique({
          where: { id: data.groupId },
          select: { name: true },
        });
        groupName = g?.name ?? null;
      }
    }

    await prisma.class.createMany({
      data: dates.map((start) => ({
        title: data.titleAuto
          ? buildAutoTitle({ studentName, groupName, startAt: start })
          : data.title,
        titleAuto: data.titleAuto,
        startAt: start,
        endAt: new Date(start.getTime() + duration),
        modality: data.modality,
        location: data.location,
        notes: data.notes,
        groupId: data.groupId,
        studentId: data.studentId,
        meetLink,
        seriesId,
        seriesNote,
      })),
    });

    await audit({
      actorUserId: session.user.id,
      action: "class.series.create",
      entity: "Class",
      entityId: seriesId,
      payload: { count: dates.length, weekdays: recurrence.weekdays },
    });
    revalidatePath("/classes");
    redirect("/classes");
  }

  const c = await prisma.class.create({
    data: {
      ...data,
      meetLink,
      attachments: {
        create: [
          ...worksheetIds.map((id) => ({ worksheetId: id })),
          ...materialIds.map((id) => ({ materialId: id })),
        ],
      },
    },
  });

  if (data.studentId) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
        select: { driveFolderId: true },
      });
      if (student?.driveFolderId) {
        const dateStr = format(data.startAt, "dd-MM-yyyy");
        const classFolderId = await createDriveFolder(
          session.user.id,
          `CLASE_${dateStr}`,
          student.driveFolderId,
        );
        const doc = await createDriveDoc(
          session.user.id,
          `Clase ${dateStr} - ${data.title}`,
          classFolderId,
        );
        await prisma.class.update({
          where: { id: c.id },
          data: {
            driveFolderId: classFolderId,
            driveDocId: doc.id,
            driveDocUrl: doc.webViewLink,
          },
        });
      }
    } catch {
      // Drive not connected — continue
    }
  }

  await audit({
    actorUserId: session.user.id,
    action: "class.create",
    entity: "Class",
    entityId: c.id,
  });
  revalidatePath("/classes");
  redirect("/classes");
}

export async function updateClass(id: string, formData: FormData) {
  const session = await requireRole(Role.TEACHER);
  const data = ClassSchema.parse(parseFields(formData));
  const { worksheetIds, materialIds } = getAttachmentIds(formData);

  // If title is auto-generated, regenerate from current values (student/group + date)
  let finalTitle = data.title;
  if (data.titleAuto) {
    const [student, group] = await Promise.all([
      data.studentId
        ? prisma.student.findUnique({
            where: { id: data.studentId },
            select: { firstName: true },
          })
        : null,
      data.groupId
        ? prisma.group.findUnique({
            where: { id: data.groupId },
            select: { name: true },
          })
        : null,
    ]);
    finalTitle = buildAutoTitle({
      studentName: student?.firstName ?? null,
      groupName: group?.name ?? null,
      startAt: data.startAt,
    });
  }

  await prisma.$transaction([
    prisma.class.update({ where: { id }, data: { ...data, title: finalTitle } }),
    prisma.classAttachment.deleteMany({ where: { classId: id } }),
    prisma.classAttachment.createMany({
      data: [
        ...worksheetIds.map((wid) => ({ classId: id, worksheetId: wid })),
        ...materialIds.map((mid) => ({ classId: id, materialId: mid })),
      ],
    }),
  ]);

  await audit({
    actorUserId: session.user.id,
    action: "class.update",
    entity: "Class",
    entityId: id,
  });
  revalidatePath(`/classes/${id}`);
  revalidatePath("/classes");
  redirect("/classes");
}

/**
 * Move a class.
 * - When `keepTime` is true (month view drop), set newStart = target day @ original time.
 * - When `keepTime` is false (week/day view drop), set newStart = target full datetime.
 * Always keeps the original duration.
 */
export async function moveClass(
  classId: string,
  newDateIso: string,
  keepTime: boolean = true,
) {
  const session = await requireRole(Role.TEACHER);
  const target = new Date(newDateIso);
  if (isNaN(target.getTime())) throw new Error("Invalid date");

  const klass = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      startAt: true,
      endAt: true,
      titleAuto: true,
      student: { select: { firstName: true, lastName: true } },
      group: { select: { name: true } },
    },
  });
  if (!klass) throw new Error("Class not found");

  const duration = klass.endAt.getTime() - klass.startAt.getTime();
  let newStart: Date;
  if (keepTime) {
    const targetMadrid = inMadrid(target);
    const currentMadrid = inMadrid(klass.startAt);
    const pad = (value: number) => String(value).padStart(2, "0");
    newStart = parseMadridDateTime(
      `${targetMadrid.getFullYear()}-${pad(targetMadrid.getMonth() + 1)}-${pad(targetMadrid.getDate())}` +
        `T${pad(currentMadrid.getHours())}:${pad(currentMadrid.getMinutes())}`,
    );
  } else {
    newStart = new Date(target);
    newStart.setSeconds(0, 0);
  }
  const newEnd = new Date(newStart.getTime() + duration);

  const dataUpdate: { startAt: Date; endAt: Date; title?: string } = {
    startAt: newStart,
    endAt: newEnd,
  };
  if (klass.titleAuto) {
    dataUpdate.title = buildAutoTitle({
      studentName: klass.student ? `${klass.student.firstName}` : null,
      groupName: klass.group?.name,
      startAt: newStart,
    });
  }

  await prisma.class.update({ where: { id: classId }, data: dataUpdate });
  await audit({
    actorUserId: session.user.id,
    action: "class.move",
    entity: "Class",
    entityId: classId,
  });
  revalidatePath("/classes");
}

export async function deleteClassSeries(
  seriesId: string,
  opts: { onlyFuture?: boolean } = {},
) {
  const session = await requireRole(Role.TEACHER);
  const where = opts.onlyFuture
    ? { seriesId, startAt: { gte: new Date() } }
    : { seriesId };
  const result = await prisma.class.deleteMany({ where });
  await audit({
    actorUserId: session.user.id,
    action: "class.series.delete",
    entity: "Class",
    entityId: seriesId,
    payload: { count: result.count, onlyFuture: !!opts.onlyFuture },
  });
  revalidatePath("/classes");
  return result.count;
}

export async function deleteClass(id: string) {
  const session = await requireRole(Role.TEACHER);
  await prisma.class.delete({ where: { id } });
  await audit({
    actorUserId: session.user.id,
    action: "class.delete",
    entity: "Class",
    entityId: id,
  });
  revalidatePath("/classes");
  redirect("/classes");
}
