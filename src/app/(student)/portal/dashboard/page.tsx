import Link from "next/link";
import { startOfDay } from "date-fns";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await requireRole(Role.STUDENT);
  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");
  if (!session.user.studentId) return null;
  const studentId = session.user.studentId;
  const today = startOfDay(new Date());

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { groupId: true },
  });
  const groupId = student?.groupId ?? null;

  const [upcoming, pending, lastSubmissions, materials] = await Promise.all([
    prisma.class.findMany({
      where: {
        OR: [{ studentId }, ...(groupId ? [{ groupId }] : [])],
        startAt: { gte: today },
      },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
    prisma.assignment.findMany({
      where: {
        OR: [{ studentId }, ...(groupId ? [{ groupId }] : [])],
        submissions: {
          none: {
            studentId,
            correctionStatus: { in: ["SUBMITTED", "CORRECTED"] },
          },
        },
      },
      include: { worksheet: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.submission.findMany({
      where: { studentId, correctionStatus: "CORRECTED" },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: { assignment: { include: { worksheet: true } } },
    }),
    prisma.materialLink.findMany({
      where: { OR: [{ studentId }, ...(groupId ? [{ groupId }] : [])] },
      include: { material: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={tNav("dashboard")} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("upcomingClasses")}</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {upcoming.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {c.title}
                      {c.meetLink && (
                        <a
                          href={c.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Meet ↗
                        </a>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(c.startAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("pendingWorksheets")}</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {pending.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/portal/worksheets/${a.id}/solve`}
                      className="hover:underline"
                    >
                      {a.worksheet.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(a.dueAt) || ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("lastGrades")}</CardTitle>
          </CardHeader>
          <CardContent>
            {lastSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {lastSubmissions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between">
                    <span>{s.assignment.worksheet.title}</span>
                    <Badge tone="success">
                      {s.finalScore ?? "—"} / {s.maxScore ?? "—"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("recentMaterials")}</CardTitle>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {materials.map((m) => (
                  <li key={m.id}>
                    <a
                      href={`/api/files/${m.material.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {m.material.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
