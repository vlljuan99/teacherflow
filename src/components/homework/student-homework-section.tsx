import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { QuickAssign } from "./quick-assign";

export async function StudentHomeworkSection({ studentId }: { studentId: string }) {
  const t = await getTranslations("assignments");

  const [student, allAssignments, worksheets] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { groupId: true },
    }),
    prisma.assignment.findMany({
      where: {
        OR: [
          { studentId },
          // Don't include group assignments here — they're separate
        ],
      },
      include: {
        worksheet: { select: { title: true } },
        submissions: {
          where: { studentId },
          select: { correctionStatus: true, submittedAt: true, finalScore: true, maxScore: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.worksheet.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  void student;

  type A = (typeof allAssignments)[number];
  const pending: A[] = [];
  const submitted: A[] = [];
  const corrected: A[] = [];
  for (const a of allAssignments) {
    const sub = a.submissions[0];
    if (sub && sub.correctionStatus === "CORRECTED") corrected.push(a);
    else if (sub && (sub.submittedAt || sub.correctionStatus === "SUBMITTED"))
      submitted.push(a);
    else pending.push(a);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> {t("homework")}
        </CardTitle>
        <QuickAssign studentId={studentId} worksheets={worksheets} />
      </CardHeader>
      <CardContent className="space-y-4">
        <HomeworkBucket
          title={t("pending")}
          icon={ClipboardList}
          tone="warning"
          items={pending}
          emptyLabel={t("noPending")}
        />
        <HomeworkBucket
          title={t("submitted")}
          icon={ClipboardCheck}
          tone="info"
          items={submitted}
          emptyLabel={t("noSubmitted")}
        />
        <HomeworkBucket
          title={t("corrected")}
          icon={CheckCircle2}
          tone="success"
          items={corrected}
          emptyLabel={t("noCorrected")}
        />
      </CardContent>
    </Card>
  );
}

function HomeworkBucket({
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
    worksheet: { title: string };
    dueAt: Date | null;
    submissions: { finalScore: number | null; maxScore: number | null; submittedAt: Date | null }[];
  }[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
        <Badge tone={tone}>{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((a) => {
            const sub = a.submissions[0];
            const score = sub?.finalScore;
            const max = sub?.maxScore;
            return (
              <li key={a.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/40">
                <Link href={`/assignments/${a.id}`} className="min-w-0 flex-1 hover:underline">
                  <span className="font-medium">{a.worksheet.title}</span>
                </Link>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  {score != null && (
                    <span className="font-semibold text-success">
                      {score}
                      {max ? `/${max}` : ""}
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
    </div>
  );
}
