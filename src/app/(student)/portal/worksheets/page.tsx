import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentWorksheetsPage() {
  const session = await requireRole(Role.STUDENT);
  const t = await getTranslations("assignments");
  const tCommon = await getTranslations("common");
  if (!session.user.studentId) return null;

  const studentId = session.user.studentId;
  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        { studentId },
        { group: { students: { some: { id: studentId } } } },
      ],
    },
    include: {
      worksheet: { select: { title: true, level: true } },
      submissions: { where: { studentId }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title={t("title")} />
      {assignments.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{t("worksheet")}</TH>
                <TH>{t("dueAt")}</TH>
                <TH>{t("status")}</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {assignments.map((a) => {
                const sub = a.submissions[0];
                const status = sub?.correctionStatus ?? "PENDING";
                return (
                  <TR key={a.id}>
                    <TD>
                      <span className="font-medium">{a.worksheet.title}</span>{" "}
                      <span className="text-xs text-muted-foreground">
                        {a.worksheet.level}
                      </span>
                    </TD>
                    <TD>{formatDate(a.dueAt)}</TD>
                    <TD>
                      <Badge
                        tone={
                          status === "CORRECTED"
                            ? "success"
                            : status === "SUBMITTED"
                              ? "info"
                              : status === "IN_PROGRESS"
                                ? "warning"
                                : "muted"
                        }
                      >
                        {status}
                      </Badge>
                      {sub?.finalScore != null && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {sub.finalScore}/{sub.maxScore}
                        </span>
                      )}
                    </TD>
                    <TD>
                      <Link
                        className="text-sm text-primary hover:underline"
                        href={`/portal/worksheets/${a.id}/solve`}
                      >
                        {status === "CORRECTED" ? tCommon("open") : "Abrir"}
                      </Link>
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
