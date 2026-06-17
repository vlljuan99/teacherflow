"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExerciseSolver,
  type AnswerValue,
  type ExerciseInput,
} from "./exercise-solver";
import { saveProgress, submitSubmission } from "@/server/actions/submissions";

type ExerciseTypeLabels = Record<string, string>;

export function SolverForm({
  submissionId,
  exercises,
  initialAnswers,
  audioUrlByMaterialId,
  typeLabels,
  finalReview,
  readOnly,
}: {
  submissionId: string;
  exercises: ExerciseInput[];
  initialAnswers: Record<string, AnswerValue>;
  audioUrlByMaterialId: Record<string, string>;
  typeLabels: ExerciseTypeLabels;
  finalReview?: { finalScore: number | null; maxScore: number | null; teacherComment: string | null };
  readOnly?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);
  const [pending, setPending] = useState<"save" | "submit" | null>(null);

  async function onSave() {
    setPending("save");
    const fd = new FormData();
    fd.set("submissionId", submissionId);
    fd.set("answersJson", JSON.stringify(answers));
    try {
      await saveProgress(fd);
    } finally {
      setPending(null);
    }
  }

  async function onSubmit() {
    setPending("submit");
    const fd = new FormData();
    fd.set("submissionId", submissionId);
    fd.set("answersJson", JSON.stringify(answers));
    await submitSubmission(fd);
    // submitSubmission redirects on the server
  }

  return (
    <div className="space-y-4">
      {finalReview && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm">
              <span className="font-medium">Resultado:</span>{" "}
              {finalReview.finalScore != null
                ? `${finalReview.finalScore} / ${finalReview.maxScore}`
                : "—"}
            </p>
            {finalReview.teacherComment && (
              <p className="mt-1 text-sm text-muted-foreground">
                {finalReview.teacherComment}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {exercises.map((ex, idx) => (
        <Card key={ex.id}>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">#{idx + 1}</span>
              <Badge tone="muted">{typeLabels[ex.type] ?? ex.type}</Badge>
              <span className="text-muted-foreground">{ex.points} pts</span>
            </div>
            <p className="font-medium">{ex.prompt}</p>
            <ExerciseSolver
              exercise={ex}
              value={answers[ex.id]}
              onChange={(next) =>
                setAnswers((prev) => ({ ...prev, [ex.id]: next }))
              }
              audioUrlByMaterialId={audioUrlByMaterialId}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>
      ))}
      {!readOnly && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onSave} disabled={!!pending}>
            {pending === "save" ? "Guardando…" : "Guardar progreso"}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={!!pending}>
            {pending === "submit" ? "Enviando…" : "Enviar ficha"}
          </Button>
        </div>
      )}
    </div>
  );
}
