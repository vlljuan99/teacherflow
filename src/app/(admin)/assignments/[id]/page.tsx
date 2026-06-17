import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { deleteAssignment } from "@/server/actions/assignments";
import { getTranslations } from "next-intl/server";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("assignments");
  const tCommon = await getTranslations("common");
  const a = await prisma.assignment.findUnique({
    where: { id },
    include: {
      worksheet: true,
      student: true,
      group: { include: { students: true } },
      submissions: { include: { student: true } },
    },
  });
  if (!a) notFound();
  const targetedStudents = a.studentId
    ? [a.student!]
    : a.group?.students ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={a.worksheet.title}
        description={
          a.student
            ? `${a.student.firstName} ${a.student.lastName}`
            : a.group?.name ?? ""
        }
        actions={
          <form
            action={async () => {
              "use server";
              await deleteAssignment(a.id);
            }}
          >
            <Button variant="destructive" type="submit">
              <Trash2 className="h-4 w-4" /> {tCommon("delete")}
            </Button>
          </form>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("dueAt")}</CardTitle>
          </CardHeader>
          <CardContent>{formatDate(a.dueAt) || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{t(`statusOptions.${a.status}`)}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{tCommon("createdAt")}</CardTitle>
          </CardHeader>
          <CardContent>{formatDateTime(a.createdAt)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("submissions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t("student")}</TH>
                <TH>{t("status")}</TH>
                <TH>{tCommon("date")}</TH>
                <TH>Auto</TH>
                <TH>Final</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {targetedStudents.map((s) => {
                const sub = a.submissions.find((x) => x.studentId === s.id);
                return (
                  <TR key={s.id}>
                    <TD>
                      <Link href={`/students/${s.id}`} className="hover:underline">
                        {s.firstName} {s.lastName}
                      </Link>
                    </TD>
                    <TD>
                      <Badge
                        tone={
                          sub?.correctionStatus === "CORRECTED"
                            ? "success"
                            : sub?.correctionStatus === "SUBMITTED"
                              ? "info"
                              : "muted"
                        }
                      >
                        {sub?.correctionStatus ?? "—"}
                      </Badge>
                    </TD>
                    <TD className="text-muted-foreground">
                      {formatDate(sub?.submittedAt)}
                    </TD>
                    <TD>{sub?.autoScore ?? "—"}</TD>
                    <TD>{sub?.finalScore ?? "—"}</TD>
                    <TD>
                      {sub ? (
                        <Link
                          className="text-sm text-primary hover:underline"
                          href={`/assignments/${a.id}/corrections/${sub.id}`}
                        >
                          {tCommon("open")}
                        </Link>
                      ) : null}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
