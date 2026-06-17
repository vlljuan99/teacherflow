import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { deleteStudent } from "@/server/actions/students";
import { ageFromBirthDate, formatDate, formatMoney } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MeetButton } from "@/components/ui/meet-button";
import { CreateMeetButton } from "@/components/students/create-meet-button";
import { NotebookSection } from "@/components/notebook/notebook-section";
import { StudentHomeworkSection } from "@/components/homework/student-homework-section";
import { StudentClassesSection } from "@/components/students/student-classes-section";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("students");
  const tCommon = await getTranslations("common");
  const tPayments = await getTranslations("payments");
  const tConsents = await getTranslations("consents");
  const tAssign = await getTranslations("assignments");
  const tClasses = await getTranslations("classes");
  const tLevel = await getTranslations("level");

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      group: true,
      guardians: { include: { guardian: true } },
      payments: { orderBy: { dueDate: "desc" }, take: 10 },
      consents: { orderBy: { acceptedAt: "desc" } },
    },
  });
  if (!student) notFound();
  const age = ageFromBirthDate(student.birthDate);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            src={student.photoUrl}
            name={`${student.firstName} ${student.lastName}`}
            size="xl"
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tLevel(student.level)} · {student.group?.name ?? t("individual")}
            </p>
            <div className="mt-2">
              {student.meetLink ? (
                <MeetButton href={student.meetLink} label="Sala de Meet" size="sm" />
              ) : (
                <CreateMeetButton studentId={student.id} />
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/students/${student.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" /> {tCommon("edit")}
            </Button>
          </Link>
          <form
            action={async () => {
              "use server";
              await deleteStudent(student.id);
            }}
          >
            <Button variant="destructive" type="submit">
              <Trash2 className="h-4 w-4" /> {tCommon("delete")}
            </Button>
          </form>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("personalData")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t("email")} value={student.email ?? "—"} />
            <Row label={t("phone")} value={student.phone ?? "—"} />
            <Row
              label={t("birthDate")}
              value={`${formatDate(student.birthDate)}${age != null ? ` (${age})` : ""}`}
            />
            <Row
              label={t("status")}
              value={
                <Badge
                  tone={
                    student.status === "ACTIVE"
                      ? "success"
                      : student.status === "PENDING"
                        ? "warning"
                        : "muted"
                  }
                >
                  {t(`statusOptions.${student.status}`)}
                </Badge>
              }
            />
            <Row label={t("isMinor")} value={student.isMinor ? tCommon("yes") : tCommon("no")} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("guardians")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {student.guardians.length === 0 && (
              <p className="text-muted-foreground">—</p>
            )}
            {student.guardians.map(({ guardian: g }) => (
              <Link
                key={g.id}
                href={`/guardians/${g.id}`}
                className="block hover:underline"
              >
                {g.firstName} {g.lastName}
                {g.relationship ? ` · ${g.relationship}` : ""}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {student.notes ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <StudentClassesSection studentId={student.id} />

      <StudentHomeworkSection studentId={student.id} />

      <NotebookSection studentId={student.id} />

      <Card>
        <CardHeader>
          <CardTitle>{tPayments("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {student.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{tPayments("concept")}</TH>
                  <TH>{tPayments("amount")}</TH>
                  <TH>{tPayments("status")}</TH>
                  <TH>{tPayments("dueDate")}</TH>
                </TR>
              </THead>
              <TBody>
                {student.payments.map((p) => (
                  <TR key={p.id}>
                    <TD>{p.concept}</TD>
                    <TD>{formatMoney(p.amountCents, p.currency)}</TD>
                    <TD>
                      <Badge
                        tone={
                          p.status === "PAID"
                            ? "success"
                            : p.status === "OVERDUE"
                              ? "destructive"
                              : p.status === "PENDING"
                                ? "warning"
                                : "muted"
                        }
                      >
                        {tPayments(`statusOptions.${p.status}`)}
                      </Badge>
                    </TD>
                    <TD>{formatDate(p.dueDate)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tConsents("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {student.consents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{tConsents("type")}</TH>
                  <TH>{tConsents("version")}</TH>
                  <TH>{tConsents("status")}</TH>
                  <TH>{tConsents("acceptedAt")}</TH>
                </TR>
              </THead>
              <TBody>
                {student.consents.map((c) => (
                  <TR key={c.id}>
                    <TD>{tConsents(`typeOptions.${c.type}`)}</TD>
                    <TD>{c.version}</TD>
                    <TD>
                      <Badge tone={c.status === "ACCEPTED" ? "success" : "muted"}>
                        {tConsents(`statusOptions.${c.status}`)}
                      </Badge>
                    </TD>
                    <TD>{formatDate(c.acceptedAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
