import Link from "next/link";
import { startOfWeek, endOfWeek, addWeeks, format, isSameWeek } from "date-fns";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role, ATTENDANCE_ORDER, AttendanceStatus } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "info"> = {
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "destructive",
  EXCUSED: "info",
};

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams?: Promise<{ week?: string }>;
}) {
  await requireRole(Role.TEACHER);
  const t = await getTranslations("attendance");
  const sp = (await searchParams) ?? {};

  const base = sp.week ? new Date(sp.week) : new Date();
  const valid = !Number.isNaN(base.getTime()) ? base : new Date();
  const weekStart = startOfWeek(valid, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(valid, { weekStartsOn: 1 });
  const prevWeek = format(addWeeks(weekStart, -1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(weekStart, 1), "yyyy-MM-dd");
  const isCurrentWeek = isSameWeek(valid, new Date(), { weekStartsOn: 1 });

  const records = await prisma.attendance.findMany({
    where: { class: { startAt: { gte: weekStart, lte: weekEnd } } },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  type Entry = {
    id: string;
    name: string;
    counts: Record<string, number>;
    total: number;
  };
  const byStudent = new Map<string, Entry>();
  for (const r of records) {
    let e = byStudent.get(r.student.id);
    if (!e) {
      e = {
        id: r.student.id,
        name: `${r.student.firstName} ${r.student.lastName}`,
        counts: {},
        total: 0,
      };
      byStudent.set(r.student.id, e);
    }
    e.counts[r.status] = (e.counts[r.status] ?? 0) + 1;
    e.total += 1;
  }
  const rows = Array.from(byStudent.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const rangeLabel = `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`;

  return (
    <div className="space-y-6">
      <PageHeader title={t("reportTitle")} description={t("reportIntro")} />

      <div className="flex items-center justify-between gap-2">
        <Link href={`/attendance?week=${prevWeek}`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" /> {t("prevWeek")}
          </Button>
        </Link>
        <div className="text-center text-sm font-semibold">
          {rangeLabel}
          {isCurrentWeek && (
            <Badge tone="default" className="ml-2 align-middle">
              {t("thisWeek")}
            </Badge>
          )}
        </div>
        <Link href={`/attendance?week=${nextWeek}`}>
          <Button variant="outline" size="sm">
            {t("nextWeek")} <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t("noRecords")} description={t("noRecordsHint")} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{t("student")}</TH>
                {ATTENDANCE_ORDER.map((st) => (
                  <TH key={st} className="text-center">
                    {t(`statusOptions.${st}`)}
                  </TH>
                ))}
                <TH className="text-center">{t("rate")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((e) => {
                const present =
                  (e.counts[AttendanceStatus.PRESENT] ?? 0) +
                  (e.counts[AttendanceStatus.LATE] ?? 0);
                const rate = e.total > 0 ? Math.round((present / e.total) * 100) : 0;
                return (
                  <TR key={e.id}>
                    <TD className="font-medium">{e.name}</TD>
                    {ATTENDANCE_ORDER.map((st) => (
                      <TD key={st} className="text-center">
                        {e.counts[st] ? (
                          <Badge tone={STATUS_TONE[st]}>{e.counts[st]}</Badge>
                        ) : (
                          <span className="text-muted-foreground">·</span>
                        )}
                      </TD>
                    ))}
                    <TD className="text-center">
                      <Badge
                        tone={rate >= 80 ? "success" : rate >= 50 ? "warning" : "destructive"}
                      >
                        {rate}%
                      </Badge>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
