import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addDays,
  parseISO,
  isValid,
} from "date-fns";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { MeetButton } from "@/components/ui/meet-button";
import { CalendarWithFilters } from "./_calendar-filters";

export const dynamic = "force-dynamic";

type View = "month" | "week" | "day";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; view?: string; m?: string }>;
}) {
  const t = await getTranslations("classes");
  const { d, view: viewParam, m } = await searchParams;

  let anchor = new Date();
  if (d) {
    const parsed = parseISO(d);
    if (isValid(parsed)) anchor = parsed;
  } else if (m) {
    const parsed = parseISO(m + "-01");
    if (isValid(parsed)) anchor = parsed;
  }

  const view: View = viewParam === "week" || viewParam === "day" ? viewParam : "month";

  let rangeStart: Date;
  let rangeEnd: Date;
  if (view === "month") {
    rangeStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
    rangeEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  } else if (view === "week") {
    rangeStart = startOfWeek(anchor, { weekStartsOn: 1 });
    rangeEnd = addDays(rangeStart, 6);
    rangeEnd = endOfDay(rangeEnd);
  } else {
    rangeStart = startOfDay(anchor);
    rangeEnd = endOfDay(anchor);
  }

  const [periodClasses, upcoming, students, groups] = await Promise.all([
    prisma.class.findMany({
      where: { startAt: { gte: rangeStart, lte: rangeEnd } },
      orderBy: { startAt: "asc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, meetLink: true } },
        group: { select: { id: true, name: true } },
      },
    }),
    prisma.class.findMany({
      where: { startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        meetLink: true,
        student: { select: { firstName: true, lastName: true } },
        group: { select: { name: true } },
      },
    }),
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const events = periodClasses.map((c) => {
    const studentSeed = c.studentId ?? c.groupId ?? undefined;
    const studentLabel = c.student
      ? `${c.student.firstName} ${c.student.lastName}`
      : c.group?.name ?? "";
    const meetLink = c.meetLink ?? c.student?.meetLink ?? null;
    return {
      id: c.id,
      title: c.title,
      startAt: c.startAt,
      endAt: c.endAt,
      href: `/classes/${c.id}`,
      modality: c.modality as "ONLINE" | "IN_PERSON",
      studentSeed,
      studentLabel,
      meetLink,
      hasMeet: Boolean(meetLink),
      studentId: c.studentId,
      groupId: c.groupId,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/classes/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("new")}
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <CalendarWithFilters
            anchor={anchor}
            view={view}
            events={events}
            students={students}
            groups={groups}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("upcoming")}</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((c) => {
                const who = c.student
                  ? `${c.student.firstName} ${c.student.lastName}`
                  : c.group?.name ?? "";
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <Link className="font-medium hover:underline" href={`/classes/${c.id}`}>
                        {who || c.title}
                      </Link>
                      {who && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {c.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">{formatDateTime(c.startAt)}</span>
                      {c.meetLink && <MeetButton href={c.meetLink} size="xs" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
