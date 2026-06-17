import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExerciseSolver } from "@/components/worksheet/exercises/exercise-solver";
import { saveCorrection } from "@/server/actions/submissions";
import { safeJsonParse } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export default async function CorrectionPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  const t = await getTranslations("corrections");
  const tCommon = await getTranslations("common");
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
      assignment: {
        include: { worksheet: { include: { exercises: { orderBy: { order: "asc" } } } } },
      },
      answers: true,
    },
  });
  if (!sub || sub.assignmentId !== id) notFound();
  const answersById = Object.fromEntries(sub.answers.map((a) => [a.exerciseId, a]));
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("title")} · ${sub.student.firstName} ${sub.student.lastName}`}
        description={sub.assignment.worksheet.title}
      />
      <form action={saveCorrection} className="space-y-6">
        <input type="hidden" name="submissionId" value={sub.id} />
        {sub.assignment.worksheet.exercises.map((ex, idx) => {
          const ans = answersById[ex.id];
          return (
            <Card key={ex.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center gap-2 text-xs">
                  <span>#{idx + 1}</span>
                  <Badge tone="muted">{ex.type}</Badge>
                  <span>{ex.points} pts</span>
                  {ans?.autoCorrect === true && <Badge tone="success">Auto OK</Badge>}
                  {ans?.autoCorrect === false && (
                    <Badge tone="destructive">Auto fallo</Badge>
                  )}
                  {ans?.autoCorrect == null && ans && (
                    <Badge tone="warning">Pendiente manual</Badge>
                  )}
                </div>
                <p className="font-medium">{ex.prompt}</p>
                <ExerciseSolver
                  exercise={{
                    id: ex.id,
                    type: ex.type,
                    prompt: ex.prompt,
                    points: ex.points,
                    payload: safeJsonParse(ex.payload, {} as Record<string, unknown>),
                  }}
                  value={safeJsonParse(ans?.value, {} as Record<string, unknown>)}
                  readOnly
                />
                {ans && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <Label>{t("manualScore")} (máx {ex.points})</Label>
                      <Input
                        name={`answer.${ans.id}.manualScore`}
                        type="number"
                        min={0}
                        max={ex.points}
                        step="0.5"
                        defaultValue={ans.manualScore ?? ""}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t("comment")}</Label>
                      <Input
                        name={`answer.${ans.id}.comment`}
                        defaultValue={ans.teacherComment ?? ""}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div>
              <Label>{t("comment")}</Label>
              <Textarea
                name="teacherComment"
                rows={3}
                defaultValue={sub.teacherComment ?? ""}
              />
            </div>
            <Button type="submit">{t("saveCorrection")}</Button>
            {sub.finalScore != null && (
              <p className="text-sm text-muted-foreground">
                {t("finalScore")}: {sub.finalScore} / {sub.maxScore} ({tCommon("status")}:{" "}
                {sub.correctionStatus})
              </p>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
