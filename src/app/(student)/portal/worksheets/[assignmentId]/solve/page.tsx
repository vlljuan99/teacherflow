import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { PageHeader } from "@/components/layout/page-header";
import { SolverForm } from "@/components/worksheet/exercises/solver-form";
import { getOrCreateSubmission } from "@/server/actions/submissions";
import { getTranslations } from "next-intl/server";
import { safeJsonParse } from "@/lib/utils";

export default async function SolvePage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await requireRole(Role.STUDENT);
  if (!session.user.studentId) notFound();

  const submission = await getOrCreateSubmission(assignmentId);
  const t = await getTranslations("worksheets");

  const data = await prisma.submission.findUnique({
    where: { id: submission.id },
    include: {
      assignment: {
        include: { worksheet: { include: { exercises: { orderBy: { order: "asc" } } } } },
      },
      answers: true,
    },
  });
  if (!data) notFound();

  const exercises = data.assignment.worksheet.exercises.map((ex) => ({
    id: ex.id,
    type: ex.type,
    prompt: ex.prompt,
    points: ex.points,
    payload: safeJsonParse(ex.payload, {} as Record<string, unknown>),
  }));

  const initialAnswers: Record<string, Record<string, unknown>> = {};
  for (const a of data.answers) {
    initialAnswers[a.exerciseId] = safeJsonParse(a.value, {} as Record<string, unknown>);
  }

  const audioMap: Record<string, string> = {};
  for (const ex of exercises) {
    if (ex.type === "LISTENING") {
      const id = (ex.payload.audioMaterialId as string) ?? "";
      if (id) audioMap[id] = `/api/files/${id}`;
    }
  }

  const typeLabels: Record<string, string> = {};
  for (const k of [
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "FILL_BLANKS",
    "SHORT_ANSWER",
    "MATCH_COLUMNS",
    "ORDER_WORDS",
    "READING",
    "LISTENING",
    "WRITING",
  ]) {
    typeLabels[k] = t(`types.${k}` as never);
  }

  const isCorrected = data.correctionStatus === "CORRECTED";
  const isSubmitted = data.correctionStatus === "SUBMITTED";

  return (
    <div>
      <PageHeader
        title={data.assignment.worksheet.title}
        description={data.assignment.worksheet.description ?? ""}
      />
      <SolverForm
        submissionId={data.id}
        exercises={exercises}
        initialAnswers={initialAnswers}
        audioUrlByMaterialId={audioMap}
        typeLabels={typeLabels}
        readOnly={isCorrected || isSubmitted}
        finalReview={
          isCorrected
            ? {
                finalScore: data.finalScore,
                maxScore: data.maxScore,
                teacherComment: data.teacherComment,
              }
            : undefined
        }
      />
    </div>
  );
}
