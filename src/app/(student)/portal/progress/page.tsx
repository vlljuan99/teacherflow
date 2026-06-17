import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScoreChart } from "@/components/charts/score-chart";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage() {
  const session = await requireRole(Role.STUDENT);
  const t = await getTranslations("dashboard");
  if (!session.user.studentId) return null;
  const submissions = await prisma.submission.findMany({
    where: { studentId: session.user.studentId, correctionStatus: "CORRECTED" },
    include: { assignment: { include: { worksheet: true } } },
    orderBy: { submittedAt: "asc" },
  });
  const points = submissions
    .filter((s) => s.finalScore != null && s.maxScore)
    .map((s) => ({
      label: format(s.submittedAt ?? s.createdAt, "dd/MM"),
      value: Math.round(((s.finalScore ?? 0) / (s.maxScore ?? 1)) * 100),
    }));
  return (
    <div className="space-y-6">
      <PageHeader title={t("progress")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("progress")} (%)</CardTitle>
        </CardHeader>
        <CardContent>
          {points.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ScoreChart data={points} />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("lastGrades")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Ficha</TH>
                <TH>Fecha</TH>
                <TH>Nota</TH>
                <TH>Comentario</TH>
              </TR>
            </THead>
            <TBody>
              {submissions.map((s) => (
                <TR key={s.id}>
                  <TD>{s.assignment.worksheet.title}</TD>
                  <TD className="text-muted-foreground">{formatDate(s.submittedAt)}</TD>
                  <TD>
                    <Badge tone="success">
                      {s.finalScore ?? "—"} / {s.maxScore ?? "—"}
                    </Badge>
                  </TD>
                  <TD className="text-muted-foreground">{s.teacherComment ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
