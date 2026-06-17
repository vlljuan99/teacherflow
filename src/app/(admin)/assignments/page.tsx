import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Plus, ClipboardList, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const t = await getTranslations("assignments");
  const assignments = await prisma.assignment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      worksheet: { select: { title: true } },
      student: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
      group: { select: { id: true, name: true } },
      submissions: {
        select: {
          submittedAt: true,
          correctionStatus: true,
          finalScore: true,
          maxScore: true,
        },
      },
    },
  });

  type A = (typeof assignments)[number];
  const pending: A[] = [];
  const submitted: A[] = [];
  const corrected: A[] = [];
  for (const a of assignments) {
    const anyCorrected = a.submissions.some((s) => s.correctionStatus === "CORRECTED");
    const anySubmitted = a.submissions.some(
      (s) => s.submittedAt || s.correctionStatus === "SUBMITTED",
    );
    if (anyCorrected) corrected.push(a);
    else if (anySubmitted) submitted.push(a);
    else pending.push(a);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/assignments/new">
            <Button>
              <Plus className="h-4 w-4" /> {t("new")}
            </Button>
          </Link>
        }
      />
      <Bucket title={t("pending")} icon={ClipboardList} tone="warning" items={pending} emptyLabel={t("noPending")} />
      <Bucket title={t("submitted")} icon={ClipboardCheck} tone="info" items={submitted} emptyLabel={t("noSubmitted")} />
      <Bucket title={t("corrected")} icon={CheckCircle2} tone="success" items={corrected} emptyLabel={t("noCorrected")} />
    </div>
  );
}

function Bucket({
  title,
  icon: Icon,
  tone,
  items,
  emptyLabel,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "warning" | "info" | "success";
  items: {
    id: string;
    dueAt: Date | null;
    worksheet: { title: string };
    student: { id: string; firstName: string; lastName: string; photoUrl: string | null } | null;
    group: { id: string; name: string } | null;
    submissions: {
      submittedAt: Date | null;
      correctionStatus: string;
      finalScore: number | null;
      maxScore: number | null;
    }[];
  }[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4" /> {title}
          <Badge tone={tone}>{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {items.map((a) => {
              const sub = a.submissions[0];
              const studentName = a.student
                ? `${a.student.firstName} ${a.student.lastName}`
                : a.group?.name ?? "—";
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted/40">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {a.student ? (
                      <Avatar src={a.student.photoUrl} name={studentName} size="sm" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                        G
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link href={`/assignments/${a.id}`} className="block truncate font-medium hover:underline">
                        {a.worksheet.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{studentName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    {sub?.finalScore != null && (
                      <span className="font-semibold text-success">
                        {sub.finalScore}
                        {sub.maxScore ? `/${sub.maxScore}` : ""}
                      </span>
                    )}
                    {sub?.submittedAt && <span>entregado {formatDate(sub.submittedAt)}</span>}
                    {!sub?.submittedAt && a.dueAt && <span>vence {formatDate(a.dueAt)}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
