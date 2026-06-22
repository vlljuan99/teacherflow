"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseType } from "@/lib/enums";
import {
  ExerciseSolver,
  type ExerciseInput,
  type AnswerValue,
} from "@/components/worksheet/exercises/exercise-solver";
import {
  ExerciseEditor,
  type AudioMaterialOption,
} from "@/components/worksheet/editor/exercise-editor";

const TYPE_LABELS_ES: Record<string, string> = {
  MULTIPLE_CHOICE: "Opción múltiple",
  TRUE_FALSE: "Verdadero / Falso",
  FILL_BLANKS: "Rellenar huecos",
  SHORT_ANSWER: "Respuesta corta",
  MATCH_COLUMNS: "Relacionar columnas",
  ORDER_WORDS: "Ordenar palabras",
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
};

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

const CONFIDENCE_TONE: Record<Confidence, { label: string; tone: "success" | "warning" | "destructive" }> = {
  HIGH: { label: "Alta confianza", tone: "success" },
  MEDIUM: { label: "Revisar", tone: "warning" },
  LOW: { label: "Riesgo — revisar", tone: "destructive" },
};

// Compute what the Solver should render when "show solution" is on.
function solutionAsValue(
  type: string,
  payload: Record<string, unknown>,
  solution: Record<string, unknown>,
): AnswerValue | undefined {
  switch (type) {
    case ExerciseType.MULTIPLE_CHOICE:
      return { selected: (solution.correct as number[]) ?? [] };
    case ExerciseType.TRUE_FALSE:
      return { value: solution.value as boolean };
    case ExerciseType.FILL_BLANKS: {
      const answers = (solution.answers as string[][]) ?? [];
      return { answers: answers.map((a) => a[0] ?? "") };
    }
    case ExerciseType.SHORT_ANSWER: {
      const accepted = (solution.accepted as string[]) ?? [];
      return { value: accepted[0] ?? "" };
    }
    case ExerciseType.MATCH_COLUMNS:
      return { pairs: (solution.pairs as number[][]) ?? [] };
    case ExerciseType.ORDER_WORDS: {
      const words = (payload.words as string[]) ?? [];
      return { order: words.map((_, i) => i) };
    }
    case ExerciseType.READING:
    case ExerciseType.LISTENING: {
      const qs =
        (payload.questions as { accepted?: string[] }[] | undefined) ?? [];
      return { answers: qs.map((q) => q.accepted?.[0] ?? "") };
    }
    default:
      return undefined;
  }
}

export interface ReviewExercise {
  id: string;
  worksheetId: string;
  order: number;
  type: string;
  prompt: string;
  points: number;
  payload: Record<string, unknown>;
  solution: Record<string, unknown>;
}

export function ExerciseCard({
  exercise,
  audioMaterials,
  editAction,
  deleteAction,
  moveUpAction,
  moveDownAction,
  isFirst,
  isLast,
}: {
  exercise: ReviewExercise;
  audioMaterials: AudioMaterialOption[];
  editAction: (formData: FormData) => Promise<void>;
  deleteAction: () => Promise<void>;
  moveUpAction: () => Promise<void>;
  moveDownAction: () => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [showSolution, setShowSolution] = useState(false);
  const [editing, setEditing] = useState(false);

  const meta = (exercise.payload._extraction as
    | { confidence?: Confidence; sourcePage?: number | null; reviewNote?: string | null; section?: string }
    | undefined) ?? {};
  const confidence: Confidence = meta.confidence ?? "MEDIUM";
  const confInfo = CONFIDENCE_TONE[confidence];

  const solverInput: ExerciseInput = useMemo(
    () => ({
      id: exercise.id,
      type: exercise.type,
      prompt: exercise.prompt,
      points: exercise.points,
      payload: exercise.payload,
    }),
    [exercise.id, exercise.type, exercise.prompt, exercise.points, exercise.payload],
  );

  const previewValue = showSolution
    ? solutionAsValue(exercise.type, exercise.payload, exercise.solution)
    : undefined;

  return (
    <Card
      id={`exercise-${exercise.id}`}
      className={cn(
        "scroll-mt-24 transition-colors",
        confidence === "LOW" && "border-destructive/40",
        confidence === "MEDIUM" && "border-warning/40",
      )}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-mono text-muted-foreground">#{exercise.order + 1}</span>
          <Badge tone="info">{TYPE_LABELS_ES[exercise.type] ?? exercise.type}</Badge>
          <Badge tone={confInfo.tone}>{confInfo.label}</Badge>
          {meta.sourcePage != null && (
            <Badge tone="muted">Pág. {meta.sourcePage}</Badge>
          )}
          <Badge tone="muted">{exercise.points} pt</Badge>
        </div>
        <CardTitle className="text-base leading-snug">{exercise.prompt}</CardTitle>
        {meta.reviewNote && (
          <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning-foreground">
            <strong>Nota IA:</strong> {meta.reviewNote}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "rounded-md border bg-card p-4 transition-colors",
            showSolution && "border-emerald-300 bg-emerald-50/30",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {showSolution ? "Solución" : "Vista del alumno"}
            </span>
            <Button
              type="button"
              size="sm"
              variant={showSolution ? "default" : "outline"}
              onClick={() => setShowSolution((v) => !v)}
            >
              {showSolution ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Ocultar solución
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Ver solución
                </>
              )}
            </Button>
          </div>
          <ExerciseSolver
            exercise={solverInput}
            value={previewValue}
            readOnly
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            <Edit3 className="h-3.5 w-3.5" /> {editing ? "Cerrar editor" : "Editar"}
          </Button>
          <form action={moveUpAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={isFirst}
              aria-label="Subir"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
          </form>
          <form action={moveDownAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={isLast}
              aria-label="Bajar"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </form>
          <span className="flex-1" />
          <form action={deleteAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Borrar
            </Button>
          </form>
        </div>

        {editing && (
          <div className="rounded-md border border-dashed bg-muted/20 p-3">
            <ExerciseEditor
              worksheetId={exercise.worksheetId}
              action={editAction}
              audioMaterials={audioMaterials}
              initial={{
                id: exercise.id,
                type: exercise.type,
                prompt: exercise.prompt,
                points: exercise.points,
                payload: exercise.payload,
                solution: exercise.solution,
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
