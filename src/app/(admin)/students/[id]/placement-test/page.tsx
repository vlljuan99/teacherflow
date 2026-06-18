import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TestRunner } from "@/components/placement-test/test-runner";
import { ArrowLeft, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlacementTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [student, test] = await Promise.all([
    prisma.student.findUnique({ where: { id } }),
    prisma.placementTest.findUnique({ where: { studentId: id } }),
  ]);
  if (!student) notFound();

  const grammarAnswers: (string | null)[] = test?.grammarAnswers
    ? JSON.parse(test.grammarAnswers)
    : Array(10).fill(null);
  const readingAnswers: (string | null)[] = test?.readingAnswers
    ? JSON.parse(test.readingAnswers)
    : Array(10).fill(null);

  return (
    <div className="space-y-6">
      <Link
        href={`/students/${student.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a la ficha
      </Link>
      <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <Avatar src={student.photoUrl} name={`${student.firstName} ${student.lastName}`} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Placement Test</h1>
            {test?.status === "COMPLETED" ? (
              <Badge tone="success">Completado</Badge>
            ) : (
              <Badge tone="warning">En curso</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {student.firstName} {student.lastName} · Nivel actual: {student.level}
          </p>
        </div>
      </div>

      <TestRunner
        studentId={student.id}
        initial={{
          grammarAnswers,
          grammarScore: test?.grammarScore ?? null,
          readingAnswers,
          readingScore: test?.readingScore ?? null,
          writingText: test?.writingText ?? "",
          writingScore: test?.writingScore ?? null,
          writingComment: test?.writingComment ?? "",
          speakingNotes: test?.speakingNotes ?? "",
          speakingScore: test?.speakingScore ?? null,
          speakingComment: test?.speakingComment ?? "",
          finalScore: test?.finalScore ?? null,
          cefrLevel: test?.cefrLevel ?? null,
          status: test?.status ?? "IN_PROGRESS",
        }}
      />
    </div>
  );
}
