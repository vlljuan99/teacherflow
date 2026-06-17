import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseSolver } from "@/components/worksheet/exercises/exercise-solver";
import { getTranslations } from "next-intl/server";
import { safeJsonParse } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default async function WorksheetPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("worksheets");
  const worksheet = await prisma.worksheet.findUnique({
    where: { id },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!worksheet) notFound();
  const audioMaterialIds = worksheet.exercises
    .filter((e) => e.type === "LISTENING")
    .map((e) => (safeJsonParse(e.payload, {} as Record<string, unknown>).audioMaterialId as string) ?? "")
    .filter(Boolean);
  const audioMap: Record<string, string> = {};
  for (const mid of audioMaterialIds) audioMap[mid] = `/api/files/${mid}`;
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("preview")} — ${worksheet.title}`}
        description={`${worksheet.level} · ${worksheet.language}`}
        actions={
          <Link href={`/worksheets/${worksheet.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="space-y-6 pt-6">
          {worksheet.exercises.map((ex, idx) => (
            <div key={ex.id} className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">#{idx + 1}</span>
                <Badge tone="muted">{t(`types.${ex.type}`)}</Badge>
                <span className="text-muted-foreground">{ex.points} pts</span>
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
                value={undefined}
                readOnly
                audioUrlByMaterialId={audioMap}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
