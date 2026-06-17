import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/utils";
import { startOfMonth, endOfMonth, parse, isValid } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; status?: string; studentId?: string }>;
}) {
  const t = await getTranslations("payments");
  const tCommon = await getTranslations("common");
  const { m, status, studentId } = await searchParams;
  let month = new Date();
  if (m) {
    const parsed = parse(m + "-01", "yyyy-MM-dd", new Date());
    if (isValid(parsed)) month = parsed;
  }
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const where = {
    dueDate: { gte: monthStart, lte: monthEnd },
    ...(status ? { status: status as "PENDING" | "PAID" | "OVERDUE" | "CANCELED" } : {}),
    ...(studentId ? { studentId } : {}),
  };

  const [payments, students, summary] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { student: true },
      orderBy: { dueDate: "desc" },
    }),
    prisma.student.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { dueDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amountCents: true },
    }),
  ]);

  const summaryByStatus: Record<string, number> = {};
  for (const s of summary) summaryByStatus[s.status] = s._sum.amountCents ?? 0;
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/payments/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("new")}
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("monthSummary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 flex flex-wrap items-end gap-2 text-sm">
            <div>
              <label className="block">{tCommon("date")}</label>
              <input
                type="month"
                name="m"
                defaultValue={monthKey}
                className="input-base h-9"
              />
            </div>
            <div>
              <label className="block">{t("status")}</label>
              <select name="status" defaultValue={status ?? ""} className="input-base h-9">
                <option value="">{tCommon("all")}</option>
                {["PENDING", "PAID", "OVERDUE", "CANCELED"].map((s) => (
                  <option key={s} value={s}>
                    {t(`statusOptions.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block">{t("student")}</label>
              <select name="studentId" defaultValue={studentId ?? ""} className="input-base h-9">
                <option value="">{tCommon("all")}</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline" size="sm">
              {tCommon("filter")}
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Summary label={t("statusOptions.PAID")} amount={summaryByStatus.PAID ?? 0} tone="success" />
            <Summary
              label={t("statusOptions.PENDING")}
              amount={summaryByStatus.PENDING ?? 0}
              tone="warning"
            />
            <Summary
              label={t("statusOptions.OVERDUE")}
              amount={summaryByStatus.OVERDUE ?? 0}
              tone="destructive"
            />
            <Summary
              label={t("statusOptions.CANCELED")}
              amount={summaryByStatus.CANCELED ?? 0}
              tone="muted"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t("student")}</TH>
              <TH>{t("concept")}</TH>
              <TH>{t("amount")}</TH>
              <TH>{t("dueDate")}</TH>
              <TH>{t("method")}</TH>
              <TH>{t("status")}</TH>
            </TR>
          </THead>
          <TBody>
            {payments.length === 0 && (
              <TR>
                <TD colSpan={6} className="py-6 text-center text-muted-foreground">
                  {tCommon("noResults")}
                </TD>
              </TR>
            )}
            {payments.map((p) => (
              <TR key={p.id}>
                <TD>
                  <Link href={`/students/${p.studentId}`} className="hover:underline">
                    {p.student.firstName} {p.student.lastName}
                  </Link>
                </TD>
                <TD>
                  <Link href={`/payments/${p.id}`} className="hover:underline">
                    {p.concept}
                  </Link>
                </TD>
                <TD>{formatMoney(p.amountCents, p.currency)}</TD>
                <TD>{formatDate(p.dueDate)}</TD>
                <TD>{t(`methodOptions.${p.method}`)}</TD>
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
                    {t(`statusOptions.${p.status}`)}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

function Summary({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "success" | "warning" | "destructive" | "muted";
}) {
  const colors: Record<typeof tone, string> = {
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50",
    destructive: "border-red-200 bg-red-50",
    muted: "border-slate-200 bg-slate-50",
  };
  return (
    <div className={`rounded-md border p-3 text-sm ${colors[tone]}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{formatMoney(amount)}</p>
    </div>
  );
}
