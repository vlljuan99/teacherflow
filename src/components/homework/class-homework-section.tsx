import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { QuickAssign } from "./quick-assign";

export async function ClassHomeworkSection({
  studentId,
  groupId,
}: {
  studentId: string | null;
  groupId: string | null;
}) {
  if (!studentId && !groupId) return null;

  const [assignments, worksheets] = await Promise.all([
    prisma.assignment.findMany({
      where: studentId ? { studentId } : { groupId: groupId! },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        worksheet: { select: { title: true } },
        submissions: {
          select: { correctionStatus: true, submittedAt: true },
        },
      },
    }),
    prisma.worksheet.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Deberes
        </CardTitle>
        <QuickAssign
          studentId={studentId ?? undefined}
          groupId={groupId ?? undefined}
          worksheets={worksheets}
        />
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no se han asignado deberes a este alumno/grupo.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {assignments.map((a) => {
              const sub = a.submissions[0];
              let tone: "warning" | "info" | "success" = "warning";
              let label = "Pendiente";
              if (sub?.correctionStatus === "CORRECTED") {
                tone = "success";
                label = "Corregido";
              } else if (sub?.submittedAt) {
                tone = "info";
                label = "Entregado";
              }
              return (
                <li key={a.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/40">
                  <Link href={`/assignments/${a.id}`} className="min-w-0 flex-1 hover:underline">
                    <span className="font-medium">{a.worksheet.title}</span>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={tone}>{label}</Badge>
                    {a.dueAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(a.dueAt)}
                      </span>
                    )}
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
