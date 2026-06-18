import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MeetButton } from "@/components/ui/meet-button";
import { ArrowLeft, ExternalLink, FileText, ClipboardList, BookText, GraduationCap, FolderOpen } from "lucide-react";
import { ageFromBirthDate, formatDate } from "@/lib/utils";
import { ClassTimer } from "@/components/live/class-timer";
import { QuickRefs } from "@/components/live/quick-refs";
import { VocabCatcher } from "@/components/live/vocab-catcher";
import { NextSessionNote } from "@/components/live/next-session-note";
import { NotebookButton } from "@/components/live/notebook-button";
import { ClassReactions } from "@/components/live/class-reactions";
import { madridDayBounds } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function LiveClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const klass = await prisma.class.findUnique({
    where: { id },
    include: {
      student: true,
      group: { include: { students: true } },
      attachments: {
        include: {
          worksheet: { select: { id: true, title: true } },
          material: { select: { id: true, title: true, type: true } },
        },
      },
    },
  });
  if (!klass) notFound();

  const student = klass.student;
  const meetLink = klass.meetLink ?? student?.meetLink ?? null;
  const todayBounds = madridDayBounds();
  const todaySeriesClass = klass.seriesId
    ? await prisma.class.findFirst({
        where: {
          seriesId: klass.seriesId,
          id: { not: klass.id },
          startAt: { gte: todayBounds.start, lte: todayBounds.end },
        },
        orderBy: { startAt: "asc" },
        select: { id: true, title: true, startAt: true },
      })
    : null;

  // Last 3 session logs (from Tanda 4 notebook extraction) for context
  const recentSessions = student
    ? await prisma.sessionLog.findMany({
        where: { studentId: student.id, status: "PARSED" },
        orderBy: { sessionDate: "desc" },
        take: 3,
        include: { grammar: true, vocab: { take: 6 } },
      })
    : [];

  // Pending homework for the student (or group)
  const pendingHomework = student
    ? await prisma.assignment.findMany({
        where: { studentId: student.id, submissions: { none: { submittedAt: { not: null } } } },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { worksheet: { select: { title: true } } },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/classes/${klass.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver al detalle de la clase
        </Link>
      </div>

      {todaySeriesClass && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <div>
              <p className="font-semibold">Esta no es la ocurrencia de hoy</p>
              <p className="text-sm text-muted-foreground">
                Hay otra clase de esta misma serie programada para hoy.
              </p>
            </div>
            <Link href={`/classes/${todaySeriesClass.id}/live`}>
              <Button>Entrar en la clase de hoy</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Header — student card + timer */}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            {student ? (
              <Avatar
                src={student.photoUrl}
                name={`${student.firstName} ${student.lastName}`}
                size="xl"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-3xl font-bold text-white">
                G
              </div>
            )}
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {student
                  ? `${student.firstName} ${student.lastName}`
                  : klass.group?.name ?? "Clase"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {student && <Badge tone="default">{student.level}</Badge>}
                {student?.birthDate && (
                  <span>{ageFromBirthDate(student.birthDate)} años</span>
                )}
                {klass.group && !student && (
                  <span>{klass.group.students.length} alumnos</span>
                )}
              </div>
              {student?.notes && (
                <p className="mt-1 line-clamp-2 text-sm text-foreground/70">
                  {student.notes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <ClassTimer startAt={klass.startAt} endAt={klass.endAt} />
      </div>

      {/* Nota pendiente de la sesión anterior */}
      {student?.nextSessionNote && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-accent">
              📌 Nota de la sesión anterior
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{student.nextSessionNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Main actions: Meet + Notebook + Materials */}
      <div className="grid gap-3 md:grid-cols-3">
        {meetLink ? (
          <MeetButton href={meetLink} label="Entrar al Meet" size="md" className="h-auto justify-start py-4 px-4 w-full" />
        ) : (
          <Button variant="outline" disabled className="h-auto justify-start py-4">
            <ExternalLink className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Sin enlace de Meet</div>
              <div className="text-xs opacity-70">Configúralo en la ficha del alumno</div>
            </div>
          </Button>
        )}
        {student && (
          <NotebookButton
            studentId={student.id}
            notebookUrl={student.notebookDocUrl}
          />
        )}
        {klass.driveDocUrl && (
          <a href={klass.driveDocUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" className="h-auto w-full justify-start py-4">
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Doc de esta clase</div>
                <div className="text-xs opacity-70">Carpeta CLASE_{formatDate(klass.startAt)}</div>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 opacity-70" />
            </Button>
          </a>
        )}
      </div>

      {/* Attached materials/worksheets */}
      {klass.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FolderOpen className="h-4 w-4" /> Fichas y materiales adjuntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {klass.attachments.map((a) => {
                if (a.worksheet) {
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/worksheets/${a.worksheet.id}/edit`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-sm hover:border-primary hover:text-primary"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {a.worksheet.title}
                      </Link>
                    </li>
                  );
                }
                if (a.material) {
                  return (
                    <li key={a.id}>
                      <a
                        href={`/api/files/${a.material.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-sm hover:border-accent hover:text-accent"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        {a.material.title}
                      </a>
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick references */}
      <ClassReactions />

      {/* Quick references */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookText className="h-4 w-4" /> Referencias rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuickRefs />
        </CardContent>
      </Card>

      {/* Bottom: vocab catcher + side panel */}
      <div className="grid gap-4 md:grid-cols-3">
        {student && (
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <VocabCatcher
                studentId={student.id}
                hasNotebook={Boolean(student.notebookDocId)}
              />
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-accent" /> Últimas sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin sesiones procesadas todavía.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentSessions.map((s) => (
                  <li key={s.id} className="border-l-2 border-accent/40 pl-3">
                    <div className="text-xs font-medium">{formatDate(s.sessionDate)}</div>
                    {s.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{s.summary}</p>
                    )}
                    {s.grammar.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {s.grammar.map((g) => (
                          <Badge key={g.id} tone="info" className="text-[10px]">
                            {g.topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {s.vocab.length > 0 && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {s.vocab.map((v) => v.term).join(" · ")}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4 text-warning" /> Deberes pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingHomework.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada pendiente.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {pendingHomework.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/assignments/${a.id}`}
                      className="flex items-center justify-between hover:underline"
                    >
                      <span className="truncate">{a.worksheet.title}</span>
                      {a.dueAt && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatDate(a.dueAt)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next session note */}
      {student && (
        <Card>
          <CardContent className="pt-6">
            <NextSessionNote
              studentId={student.id}
              defaultValue={student.nextSessionNote ?? ""}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
