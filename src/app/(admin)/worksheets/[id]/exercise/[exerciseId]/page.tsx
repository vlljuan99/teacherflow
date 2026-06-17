import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseEditor } from "@/components/worksheet/editor/exercise-editor";
import { updateExercise } from "@/server/actions/exercises";
import { safeJsonParse } from "@/lib/utils";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string; exerciseId: string }>;
}) {
  const { id, exerciseId } = await params;
  const [ex, audioMaterials] = await Promise.all([
    prisma.exercise.findUnique({ where: { id: exerciseId } }),
    prisma.material.findMany({
      where: { type: "AUDIO" },
      select: { id: true, title: true },
    }),
  ]);
  if (!ex || ex.worksheetId !== id) notFound();
  const action = async (formData: FormData) => {
    "use server";
    await updateExercise(ex.id, formData);
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Editar ejercicio" />
      <Card>
        <CardContent className="pt-6">
          <ExerciseEditor
            worksheetId={ex.worksheetId}
            action={action}
            audioMaterials={audioMaterials}
            cancelHref={`/worksheets/${ex.worksheetId}/edit`}
            initial={{
              id: ex.id,
              type: ex.type,
              prompt: ex.prompt,
              points: ex.points,
              payload: safeJsonParse(ex.payload, {} as Record<string, unknown>),
              solution: safeJsonParse(ex.solution, {} as Record<string, unknown>),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
