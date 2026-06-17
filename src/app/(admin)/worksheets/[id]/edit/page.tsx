import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorksheetForm } from "../../_form";
import {
  updateWorksheet,
  deleteWorksheet,
  publishWorksheet,
  archiveWorksheet,
} from "@/server/actions/worksheets";
import {
  addExercise,
  deleteExercise,
  moveExercise,
} from "@/server/actions/exercises";
import { ExerciseEditor } from "@/components/worksheet/editor/exercise-editor";
import { getTranslations } from "next-intl/server";
import { ArrowUp, ArrowDown, Trash2, Eye } from "lucide-react";

export default async function EditWorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("worksheets");
  const tCommon = await getTranslations("common");
  const [worksheet, audioMaterials] = await Promise.all([
    prisma.worksheet.findUnique({
      where: { id },
      include: { exercises: { orderBy: { order: "asc" } } },
    }),
    prisma.material.findMany({
      where: { type: "AUDIO" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);
  if (!worksheet) notFound();
  const updateAction = async (formData: FormData) => {
    "use server";
    await updateWorksheet(worksheet.id, formData);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title={worksheet.title}
        description={`${worksheet.level} · ${worksheet.language}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/worksheets/${worksheet.id}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4" /> {t("preview")}
              </Button>
            </Link>
            <form
              action={async () => {
                "use server";
                if (worksheet.status === "PUBLISHED") await archiveWorksheet(worksheet.id);
                else await publishWorksheet(worksheet.id);
              }}
            >
              <Button variant="outline" type="submit">
                {worksheet.status === "PUBLISHED" ? tCommon("archive") : tCommon("publish")}
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteWorksheet(worksheet.id);
              }}
            >
              <Button variant="destructive" type="submit">
                <Trash2 className="h-4 w-4" /> {tCommon("delete")}
              </Button>
            </form>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{tCommon("details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <WorksheetForm action={updateAction} worksheet={worksheet} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("exercises")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {worksheet.exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          ) : (
            <ul className="space-y-2">
              {worksheet.exercises.map((ex, idx) => (
                <li key={ex.id} className="rounded-md border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>#{idx + 1}</span>
                        <Badge tone="muted">{t(`types.${ex.type}`)}</Badge>
                        <span>{ex.points} pts</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm">{ex.prompt}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <form
                        action={async () => {
                          "use server";
                          await moveExercise(ex.id, worksheet.id, "up");
                        }}
                      >
                        <Button variant="ghost" size="icon" type="submit" aria-label="Up">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await moveExercise(ex.id, worksheet.id, "down");
                        }}
                      >
                        <Button variant="ghost" size="icon" type="submit" aria-label="Down">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </form>
                      <Link href={`/worksheets/${worksheet.id}/exercise/${ex.id}`}>
                        <Button variant="outline" size="sm">
                          {tCommon("edit")}
                        </Button>
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteExercise(ex.id, worksheet.id);
                        }}
                      >
                        <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <details className="rounded-md border bg-muted/30 p-4">
            <summary className="cursor-pointer text-sm font-medium">
              + {t("addExercise")}
            </summary>
            <div className="mt-3">
              <ExerciseEditor
                worksheetId={worksheet.id}
                action={addExercise}
                audioMaterials={audioMaterials}
              />
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("assign")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={`/assignments/new?worksheetId=${worksheet.id}`}>
            <Button variant="outline">{t("assign")}</Button>
          </Link>
        </CardContent>
      </Card>

    </div>
  );
}
