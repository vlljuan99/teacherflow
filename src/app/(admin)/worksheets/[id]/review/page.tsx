import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseCard } from "@/components/worksheet/review/exercise-card";
import { safeJsonParse } from "@/lib/utils";
import { updateExercise, deleteExercise, moveExercise } from "@/server/actions/exercises";
import { publishWorksheet, deleteWorksheet } from "@/server/actions/worksheets";
import { AlertTriangle, CheckCircle2, Pencil, Rocket, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewWorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [worksheet, audioMaterials] = await Promise.all([
    prisma.worksheet.findUnique({
      where: { id },
      include: {
        exercises: { orderBy: { order: "asc" } },
        pdfImport: { select: { materialId: true } },
      },
    }),
    prisma.material.findMany({
      where: { type: "AUDIO" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!worksheet) notFound();

  // Parse exercises and extract section grouping from _extraction meta.
  type ParsedExercise = {
    id: string;
    worksheetId: string;
    order: number;
    type: string;
    prompt: string;
    points: number;
    payload: Record<string, unknown>;
    solution: Record<string, unknown>;
  };

  const exercises: ParsedExercise[] = worksheet.exercises.map((ex) => ({
    id: ex.id,
    worksheetId: ex.worksheetId,
    order: ex.order,
    type: ex.type,
    prompt: ex.prompt,
    points: ex.points,
    payload: safeJsonParse(ex.payload, {} as Record<string, unknown>),
    solution: safeJsonParse(ex.solution, {} as Record<string, unknown>),
  }));

  // Count confidence levels.
  const lowCount = exercises.filter(
    (e) => (e.payload._extraction as { confidence?: string } | undefined)?.confidence === "LOW",
  ).length;
  const medCount = exercises.filter(
    (e) => (e.payload._extraction as { confidence?: string } | undefined)?.confidence === "MEDIUM",
  ).length;

  // Group by section (stored in _extraction.section).
  const sections = new Map<string, ParsedExercise[]>();
  for (const ex of exercises) {
    const key =
      (ex.payload._extraction as { section?: string } | undefined)?.section ?? "Sin sección";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(ex);
  }

  const totalPoints = exercises.reduce((n, e) => n + e.points, 0);
  const materialId = worksheet.pdfImport?.materialId;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Revisión: ${worksheet.title}`}
        description={`${worksheet.level} · ${exercises.length} ejercicios · ${totalPoints} pts`}
        actions={
          <div className="flex flex-wrap gap-2">
            {materialId && (
              <Link href={`/materials/${materialId}`}>
                <Button variant="outline" size="sm">
                  Ver material PDF
                </Button>
              </Link>
            )}
            <Link href={`/worksheets/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-3.5 w-3.5" /> Editar ficha
              </Button>
            </Link>
            <form
              action={async () => {
                "use server";
                await publishWorksheet(id);
                redirect(`/worksheets/${id}/edit`);
              }}
            >
              <Button type="submit" size="sm">
                <Rocket className="h-3.5 w-3.5" /> Publicar ficha
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteWorksheet(id);
              }}
            >
              <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Descartar borrador
              </Button>
            </form>
          </div>
        }
      />

      {/* Confidence summary banner */}
      {(lowCount > 0 || medCount > 0) ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 pt-4 pb-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium text-warning-foreground">Revisa estos ejercicios antes de publicar</p>
              <p className="mt-0.5 text-muted-foreground">
                {lowCount > 0 && <span className="mr-3"><strong>{lowCount}</strong> con riesgo alto</span>}
                {medCount > 0 && <span><strong>{medCount}</strong> requieren revisión</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : exercises.length > 0 ? (
        <Card className="border-emerald-300/40 bg-emerald-50/10">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">
              Todos los ejercicios tienen alta confianza. Listo para publicar.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Exercise sections */}
      {sections.size === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No se extrajeron ejercicios del PDF. Puedes añadirlos manualmente desde{" "}
            <Link href={`/worksheets/${id}/edit`} className="text-primary underline">
              editar ficha
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        Array.from(sections.entries()).map(([sectionTitle, sectionExercises]) => (
          <Card key={sectionTitle}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                {sectionTitle}
                <Badge tone="muted">{sectionExercises.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionExercises.map((ex, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === sectionExercises.length - 1;

                const editAction = async (formData: FormData) => {
                  "use server";
                  await updateExercise(ex.id, formData);
                  revalidatePath(`/worksheets/${id}/review`);
                };
                const deleteAction = async () => {
                  "use server";
                  await deleteExercise(ex.id, id);
                  revalidatePath(`/worksheets/${id}/review`);
                };
                const moveUpAction = async () => {
                  "use server";
                  await moveExercise(ex.id, id, "up");
                  revalidatePath(`/worksheets/${id}/review`);
                };
                const moveDownAction = async () => {
                  "use server";
                  await moveExercise(ex.id, id, "down");
                  revalidatePath(`/worksheets/${id}/review`);
                };

                return (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    audioMaterials={audioMaterials}
                    editAction={editAction}
                    deleteAction={deleteAction}
                    moveUpAction={moveUpAction}
                    moveDownAction={moveDownAction}
                    isFirst={isFirst}
                    isLast={isLast}
                  />
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
