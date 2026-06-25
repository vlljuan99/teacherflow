import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, ExternalLink, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";
import { MeetButton } from "@/components/ui/meet-button";
import { DeleteClassButton } from "@/components/classes/delete-class-button";
import { ClassHomeworkSection } from "@/components/homework/class-homework-section";
import { AttendanceSection } from "@/components/classes/attendance-section";
import { SeriesBanner } from "@/components/classes/series-banner";
import { ClassForm } from "../_form";
import { updateClass } from "@/server/actions/classes";
import { saveClassAttendance } from "@/server/actions/attendance";
import { generateMeetForClass, removeMeetForClass } from "@/server/actions/google";
import { getTranslations } from "next-intl/server";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole(Role.TEACHER);
  const t = await getTranslations("classes");
  const tCommon = await getTranslations("common");
  const [klass, groups, students, worksheets, materials, googleAccount] = await Promise.all([
    prisma.class.findUnique({
      where: { id },
      include: { attachments: true },
    }),
    prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        meetLink: true,
        level: true,
      },
    }),
    prisma.worksheet.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true } }),
    prisma.material.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
    prisma.googleAccount.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!klass) notFound();

  // Attendance roster: the single student, or the group's students.
  const roster = klass.studentId
    ? students
        .filter((s) => s.id === klass.studentId)
        .map((s) => ({ id: s.id, firstName: s.firstName, lastName: s.lastName }))
    : klass.groupId
      ? await prisma.student.findMany({
          where: { groupId: klass.groupId },
          orderBy: { lastName: "asc" },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
  const attendanceRows = await prisma.attendance.findMany({
    where: { classId: klass.id },
    select: { studentId: true, status: true, note: true },
  });
  const existingAttendance = Object.fromEntries(
    attendanceRows.map((a) => [a.studentId, { status: a.status, note: a.note }]),
  );
  const saveAttendanceAction = async (formData: FormData) => {
    "use server";
    await saveClassAttendance(klass.id, formData);
  };

  const action = async (formData: FormData) => {
    "use server";
    await updateClass(klass.id, formData);
  };
  const canGenerateMeet = klass.modality === "ONLINE" && !!googleAccount;
  return (
    <div className="space-y-6">
      <PageHeader
        title={klass.title}
        actions={
          <div className="flex gap-2">
            <Link href={`/classes/${klass.id}/live`}>
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md hover:shadow-lg">
                <PlayCircle className="h-4 w-4" /> Entrar en clase
              </Button>
            </Link>
            <DeleteClassButton classId={klass.id} label={tCommon("delete")} />
          </div>
        }
      />
      {klass.modality === "ONLINE" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-4 w-4" /> Google Meet
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            {klass.meetLink ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <MeetButton href={klass.meetLink} label="Abrir Meet" size="md" />
                  <span className="text-xs text-muted-foreground break-all">{klass.meetLink}</span>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await removeMeetForClass(klass.id);
                  }}
                >
                  <Button variant="outline" size="sm" type="submit">
                    <VideoOff className="h-4 w-4" /> Quitar Meet
                  </Button>
                </form>
              </>
            ) : canGenerateMeet ? (
              <form
                action={async () => {
                  "use server";
                  await generateMeetForClass(klass.id);
                }}
              >
                <Button type="submit" size="sm">
                  <Video className="h-4 w-4" /> Generar enlace Meet
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Conecta tu Google Calendar desde el dashboard para generar el
                enlace de Meet automáticamente.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {klass.driveDocUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Google Docs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={klass.driveDocUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Abrir documento de clase <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      )}
      {klass.seriesId && (
        <SeriesBanner seriesId={klass.seriesId} seriesNote={klass.seriesNote} />
      )}

      <ClassHomeworkSection studentId={klass.studentId} groupId={klass.groupId} />

      <AttendanceSection
        roster={roster}
        existing={existingAttendance}
        action={saveAttendanceAction}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("title_field")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm
            action={action}
            groups={groups}
            students={students}
            worksheets={worksheets.map((w) => ({ id: w.id, title: w.title, type: "worksheet" as const }))}
            materials={materials.map((m) => ({ id: m.id, title: m.title, type: "material" as const }))}
            klass={{
              id: klass.id,
              title: klass.title,
              titleAuto: klass.titleAuto,
              startAt: klass.startAt,
              endAt: klass.endAt,
              modality: klass.modality,
              location: klass.location,
              notes: klass.notes,
              studentId: klass.studentId,
              groupId: klass.groupId,
              attachmentIds: {
                worksheetIds: klass.attachments.filter((a) => a.worksheetId).map((a) => a.worksheetId as string),
                materialIds: klass.attachments.filter((a) => a.materialId).map((a) => a.materialId as string),
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
