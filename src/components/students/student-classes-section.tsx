import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MeetButton } from "@/components/ui/meet-button";
import { paletteFor } from "@/components/calendar/helpers";
import {
  Calendar as CalendarIcon,
  History,
  ExternalLink,
  PlayCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PAST_LIMIT = 25;

export async function StudentClassesSection({ studentId }: { studentId: string }) {
  const now = new Date();
  const [upcoming, past, pastCount] = await Promise.all([
    prisma.class.findMany({
      where: { studentId, startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      select: classFields(),
    }),
    prisma.class.findMany({
      where: { studentId, startAt: { lt: now } },
      orderBy: { startAt: "desc" },
      take: PAST_LIMIT,
      select: classFields(),
    }),
    prisma.class.count({ where: { studentId, startAt: { lt: now } } }),
  ]);

  const palette = paletteFor(studentId);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Próximas clases
            </span>
            <Badge tone="info">{upcoming.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin clases programadas.{" "}
              <Link href={`/classes/new?studentId=${studentId}`} className="text-primary hover:underline">
                Crear una
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((c) => (
                <ClassRow key={c.id} klass={c} palette={palette} isUpcoming />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Clases pasadas
            </span>
            <Badge tone="muted">{pastCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no se ha dado ninguna clase.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {past.map((c) => (
                  <ClassRow key={c.id} klass={c} palette={palette} />
                ))}
              </ul>
              {pastCount > PAST_LIMIT && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Mostrando las {PAST_LIMIT} más recientes de {pastCount}.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function classFields() {
  return {
    id: true,
    title: true,
    startAt: true,
    endAt: true,
    modality: true,
    location: true,
    meetLink: true,
    driveDocUrl: true,
  } as const;
}

function ClassRow({
  klass: c,
  palette,
  isUpcoming = false,
}: {
  klass: {
    id: string;
    title: string;
    startAt: Date;
    endAt: Date;
    modality: string;
    location: string | null;
    meetLink: string | null;
    driveDocUrl: string | null;
  };
  palette: ReturnType<typeof paletteFor>;
  isUpcoming?: boolean;
}) {
  const duration = differenceInMinutes(c.endAt, c.startAt);
  return (
    <li
      className={cn(
        "relative flex flex-col gap-2 rounded-md border bg-card p-3 transition hover:shadow-sm",
        isUpcoming && "border-primary/30",
      )}
    >
      <span className={cn("absolute inset-y-1 left-0 w-0.5 rounded-r", palette.bar)} />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold capitalize">
            {format(c.startAt, "EEE d MMM", { locale: es })}
            <span className="text-muted-foreground">·</span>
            <span className="text-foreground">{format(c.startAt, "HH:mm")}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {fmtDur(duration)}
            </span>
            <Badge tone={c.modality === "ONLINE" ? "info" : "default"} className="text-[10px]">
              {c.modality === "ONLINE" ? "Online" : "Presencial"}
            </Badge>
            {c.modality === "IN_PERSON" && c.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {c.location}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pl-2">
        {c.meetLink && <MeetButton href={c.meetLink} size="xs" />}
        {c.driveDocUrl && (
          <a href={c.driveDocUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
              <ExternalLink className="h-3 w-3" /> Doc de clase
            </Button>
          </a>
        )}
        {isUpcoming && (
          <Link href={`/classes/${c.id}/live`}>
            <Button size="sm" className="h-7 gap-1 px-2 text-xs bg-gradient-to-r from-primary to-accent">
              <PlayCircle className="h-3 w-3" /> Entrar en clase
            </Button>
          </Link>
        )}
        <Link
          href={`/classes/${c.id}`}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Detalle →
        </Link>
      </div>
    </li>
  );
}

function fmtDur(mins: number): string {
  if (mins < 60) return `${mins}m`;
  if (mins % 60 === 0) return `${mins / 60}h`;
  return `${Math.floor(mins / 60)}h${mins % 60}`;
}
