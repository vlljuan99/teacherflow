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
  CheckSquare,
  Edit3,
  Eye,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ExerciseSolver,
  type ExerciseInput,
  type AnswerValue,
} from "@/components/worksheet/exercises/exercise-solver";
import {
  ExerciseEditor,
  type AudioMaterialOption,
} from "@/components/worksheet/editor/exercise-editor";
import {
  ExerciseReviewView,
  type ReviewExerciseData,
} from "./exercise-review-view";

const TYPE_LABELS_ES: Record<string, string> = {
  MULTIPLE_CHOICE: "Opción múltiple",
  TRUE_FALSE: "Verdadero / Falso",
  FILL_BLANKS: "Rellenar huecos",
  SHORT_ANSWER: "Respuesta corta",
  MATCH_COLUMNS: "Relacionar columnas",
  ORDER_WORDS: "Ordenar palabras (drag & drop)",
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
};

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

const CONFIDENCE_TONE: Record<
  Confidence,
  { label: string; tone: "success" | "warning" | "destructive" }
> = {
  HIGH: { label: "Alta confianza", tone: "success" },
  MEDIUM: { label: "Revisar", tone: "warning" },
  LOW: { label: "Riesgo — revisar", tone: "destructive" },
};

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

type Mode = "review" | "student";

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
  const [mode, setMode] = useState<Mode>("review");
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<AnswerValue | undefined>(undefined);

  const meta =
    (exercise.payload._extraction as
      | {
          confidence?: Confidence;
          sourcePage?: number | null;
          reviewNote?: string | null;
          section?: string;
        }
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
    [
      exercise.id,
      exercise.type,
      exercise.prompt,
      exercise.points,
      exercise.payload,
    ],
  );

  const reviewData: ReviewExerciseData = useMemo(
    () => ({
      id: exercise.id,
      type: exercise.type,
      prompt: exercise.prompt,
      payload: exercise.payload,
      solution: exercise.solution,
    }),
    [
      exercise.id,
      exercise.type,
      exercise.prompt,
      exercise.payload,
      exercise.solution,
    ],
  );

  const borderClass =
    confidence === "LOW"
      ? "border-l-4 border-l-destructive"
      : confidence === "MEDIUM"
        ? "border-l-4 border-l-warning"
        : "border-l-4 border-l-emerald-400";

  return (
    <Card
      id={`exercise-${exercise.id}`}
      className={cn("scroll-mt-24 transition-colors", borderClass)}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-mono text-muted-foreground">
            #{exercise.order + 1}
          </span>
          <Badge tone="info">
            {TYPE_LABELS_ES[exercise.type] ?? exercise.type}
          </Badge>
          <Badge tone={confInfo.tone}>{confInfo.label}</Badge>
          {meta.sourcePage != null && (
            <Badge tone="muted">Pág. {meta.sourcePage}</Badge>
          )}
          <Badge tone="muted">{exercise.points} pt</Badge>
        </div>
        <CardTitle className="text-base leading-snug">
          {exercise.prompt}
        </CardTitle>
        {meta.reviewNote && (
          <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning-foreground">
            <strong>Nota IA:</strong> {meta.reviewNote}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode tabs */}
        <div className="inline-flex rounded-md border bg-muted/30 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("review")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-medium transition-colors",
              mode === "review"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Revisión profesor
          </button>
          <button
            type="button"
            onClick={() => setMode("student")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-medium transition-colors",
              mode === "student"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Vista alumno
          </button>
        </div>

        {/* Body */}
        {mode === "review" ? (
          <div className="rounded-md border bg-emerald-50/30 p-4">
            <ExerciseReviewView exercise={reviewData} />
          </div>
        ) : (
          <div className="rounded-md border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Así lo verá el alumno (interactivo)
              </div>
              {preview && (
                <button
                  type="button"
                  onClick={() => setPreview(undefined)}
                  className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                >
                  Reiniciar
                </button>
              )}
            </div>
            <ExerciseSolver
              exercise={solverInput}
              value={preview}
              readOnly={false}
              onChange={setPreview}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            <Edit3 className="h-3.5 w-3.5" />{" "}
            {editing ? "Cerrar editor" : "Editar"}
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
