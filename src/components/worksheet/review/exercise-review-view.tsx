"use client";

import { ExerciseType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  ArrowRight,
  Volume2,
  PenLine,
  FileText,
  ListOrdered,
} from "lucide-react";

export interface ReviewExerciseData {
  id: string;
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
  solution: Record<string, unknown>;
}

export function ExerciseReviewView({
  exercise,
  audioUrlByMaterialId,
}: {
  exercise: ReviewExerciseData;
  audioUrlByMaterialId?: Record<string, string>;
}) {
  switch (exercise.type) {
    case ExerciseType.MULTIPLE_CHOICE:
      return <MultipleChoiceReview payload={exercise.payload} solution={exercise.solution} />;
    case ExerciseType.TRUE_FALSE:
      return <TrueFalseReview solution={exercise.solution} />;
    case ExerciseType.FILL_BLANKS:
      return <FillBlanksReview payload={exercise.payload} solution={exercise.solution} />;
    case ExerciseType.SHORT_ANSWER:
      return <ShortAnswerReview solution={exercise.solution} />;
    case ExerciseType.MATCH_COLUMNS:
      return <MatchColumnsReview payload={exercise.payload} solution={exercise.solution} />;
    case ExerciseType.ORDER_WORDS:
      return <OrderWordsReview payload={exercise.payload} />;
    case ExerciseType.READING:
      return <ReadingReview payload={exercise.payload} />;
    case ExerciseType.LISTENING:
      return (
        <ListeningReview
          payload={exercise.payload}
          audioUrlByMaterialId={audioUrlByMaterialId}
        />
      );
    case ExerciseType.WRITING:
      return <WritingReview payload={exercise.payload} />;
    default:
      return (
        <div className="text-xs text-muted-foreground">
          Sin vista previa para este tipo.
        </div>
      );
  }
}

/* -------------------------------------------------------------------------- */
/*  Reusable bits                                                             */
/* -------------------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function AnswerPill({
  children,
  tone = "correct",
}: {
  children: React.ReactNode;
  tone?: "correct" | "alt";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "correct"
          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
          : "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      )}
    >
      {tone === "correct" && <Check className="h-3 w-3" />}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Multiple choice                                                           */
/* -------------------------------------------------------------------------- */

function MultipleChoiceReview({
  payload,
  solution,
}: {
  payload: Record<string, unknown>;
  solution: Record<string, unknown>;
}) {
  const options = (payload.options as string[]) ?? [];
  const correct = ((solution.correct as number[]) ?? []) as number[];
  const multi = Boolean(payload.multi);

  return (
    <div className="space-y-2">
      <SectionLabel>
        Opciones {multi ? "(varias respuestas correctas)" : ""}
      </SectionLabel>
      <ul className="space-y-1.5">
        {options.map((opt, i) => {
          const isCorrect = correct.includes(i);
          return (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2.5 rounded-md border px-3 py-2 text-sm",
                isCorrect
                  ? "border-emerald-300 bg-emerald-50/70"
                  : "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isCorrect
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500",
                )}
              >
                {isCorrect ? <Check className="h-3 w-3" /> : String.fromCharCode(65 + i)}
              </span>
              <span
                className={cn(
                  "flex-1 leading-relaxed",
                  isCorrect ? "font-medium text-emerald-900" : "text-foreground/90",
                )}
              >
                {opt || <em className="text-muted-foreground">— opción vacía —</em>}
              </span>
              {isCorrect && (
                <Badge tone="success" className="shrink-0">
                  Correcta
                </Badge>
              )}
            </li>
          );
        })}
      </ul>
      {correct.length === 0 && (
        <p className="text-xs text-destructive">
          ⚠ No hay respuesta correcta marcada.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  True / False                                                              */
/* -------------------------------------------------------------------------- */

function TrueFalseReview({ solution }: { solution: Record<string, unknown> }) {
  const value = solution.value as boolean | undefined;
  return (
    <div className="space-y-2">
      <SectionLabel>Respuesta correcta</SectionLabel>
      <div className="flex gap-2">
        <div
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium",
            value === true
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-border bg-muted/30 text-muted-foreground",
          )}
        >
          {value === true && <Check className="h-4 w-4" />}
          Verdadero
        </div>
        <div
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium",
            value === false
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-border bg-muted/30 text-muted-foreground",
          )}
        >
          {value === false && <Check className="h-4 w-4" />}
          Falso
        </div>
      </div>
      {value == null && (
        <p className="text-xs text-destructive">
          ⚠ Sin respuesta correcta definida.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fill blanks                                                               */
/* -------------------------------------------------------------------------- */

function FillBlanksReview({
  payload,
  solution,
}: {
  payload: Record<string, unknown>;
  solution: Record<string, unknown>;
}) {
  const template = (payload.template as string) ?? "";
  const answers = ((solution.answers as string[][]) ?? []) as string[][];
  const parts = template.split(/_{2,}/g);
  const blanksCount = parts.length - 1;

  return (
    <div className="space-y-3">
      <SectionLabel>Frase con respuestas</SectionLabel>
      <p className="rounded-md border bg-card px-3 py-3 text-base leading-9">
        {parts.map((part, i) => {
          const alts = answers[i] ?? [];
          const primary = alts[0] ?? "";
          return (
            <span key={i}>
              {part}
              {i < blanksCount &&
                (primary ? (
                  <span className="mx-1 inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 align-baseline text-sm font-semibold text-emerald-800 ring-1 ring-emerald-300">
                    <Check className="h-3 w-3" />
                    {primary}
                  </span>
                ) : (
                  <span className="mx-1 inline-block rounded-md bg-destructive/10 px-2 py-0.5 align-baseline text-xs font-medium text-destructive ring-1 ring-destructive/30">
                    sin respuesta
                  </span>
                ))}
            </span>
          );
        })}
      </p>
      {blanksCount > 0 && (
        <div className="space-y-1.5">
          <SectionLabel>Alternativas aceptadas</SectionLabel>
          <ol className="space-y-1.5">
            {Array.from({ length: blanksCount }).map((_, i) => {
              const alts = answers[i] ?? [];
              return (
                <li
                  key={i}
                  className="flex items-baseline gap-2 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    Hueco {i + 1}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {alts.length === 0 ? (
                      <span className="text-xs text-destructive">
                        Sin respuestas
                      </span>
                    ) : (
                      alts.map((a, k) => (
                        <AnswerPill key={k} tone={k === 0 ? "correct" : "alt"}>
                          {a}
                        </AnswerPill>
                      ))
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Short answer                                                              */
/* -------------------------------------------------------------------------- */

function ShortAnswerReview({ solution }: { solution: Record<string, unknown> }) {
  const accepted = ((solution.accepted as string[]) ?? []) as string[];
  return (
    <div className="space-y-2">
      <SectionLabel>Respuestas aceptadas</SectionLabel>
      {accepted.length === 0 ? (
        <p className="text-xs text-destructive">
          ⚠ Sin respuestas aceptadas.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {accepted.map((a, i) => (
            <AnswerPill key={i} tone={i === 0 ? "correct" : "alt"}>
              {a}
            </AnswerPill>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Match columns                                                             */
/* -------------------------------------------------------------------------- */

function MatchColumnsReview({
  payload,
  solution,
}: {
  payload: Record<string, unknown>;
  solution: Record<string, unknown>;
}) {
  const left = ((payload.left as string[]) ?? []) as string[];
  const right = ((payload.right as string[]) ?? []) as string[];
  const pairs = ((solution.pairs as number[][]) ?? []) as number[][];
  const pairByLeft = new Map(pairs.map(([l, r]) => [l, r]));

  return (
    <div className="space-y-2">
      <SectionLabel>Parejas correctas</SectionLabel>
      <ul className="space-y-1.5">
        {left.map((l, i) => {
          const r = pairByLeft.get(i);
          const matched = r != null && right[r] != null;
          return (
            <li
              key={i}
              className={cn(
                "grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border px-3 py-2 text-sm",
                matched
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-destructive/40 bg-destructive/5",
              )}
            >
              <span className="font-medium text-foreground">{l}</span>
              <ArrowRight
                className={cn(
                  "h-4 w-4",
                  matched ? "text-emerald-600" : "text-destructive",
                )}
              />
              <span
                className={cn(
                  matched ? "font-medium text-emerald-900" : "text-destructive",
                )}
              >
                {matched ? right[r!] : "— sin emparejar —"}
              </span>
            </li>
          );
        })}
      </ul>
      {right.length > pairs.length && (
        <p className="text-xs text-muted-foreground">
          Hay {right.length - pairs.length} elemento(s) en la columna derecha sin
          usar.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Order words                                                               */
/* -------------------------------------------------------------------------- */

function OrderWordsReview({ payload }: { payload: Record<string, unknown> }) {
  const words = ((payload.words as string[]) ?? []) as string[];
  return (
    <div className="space-y-2">
      <SectionLabel>
        <span className="inline-flex items-center gap-1">
          <ListOrdered className="h-3 w-3" /> Orden correcto
        </span>
      </SectionLabel>
      <div className="flex flex-wrap gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/40 px-3 py-3">
        {words.length === 0 ? (
          <span className="text-xs text-destructive">Sin palabras.</span>
        ) : (
          words.map((w, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-sm font-medium text-emerald-900 ring-1 ring-emerald-300"
            >
              <span className="text-[10px] font-mono text-emerald-600">
                {i + 1}
              </span>
              {w}
            </span>
          ))
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        El alumno verá estas palabras barajadas y deberá arrastrarlas al orden
        correcto.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reading / Listening shared question list                                  */
/* -------------------------------------------------------------------------- */

function QuestionList({
  questions,
}: {
  questions: { prompt: string; accepted: string[] }[];
}) {
  if (questions.length === 0) {
    return (
      <p className="text-xs text-destructive">Sin preguntas definidas.</p>
    );
  }
  return (
    <ol className="space-y-2">
      {questions.map((q, i) => (
        <li
          key={i}
          className="rounded-md border bg-card px-3 py-2.5"
        >
          <p className="text-sm">
            <span className="mr-1 font-semibold text-muted-foreground">
              {i + 1}.
            </span>
            {q.prompt || (
              <em className="text-muted-foreground">— pregunta vacía —</em>
            )}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Respuesta:
            </span>
            {q.accepted.length === 0 ? (
              <span className="text-xs text-destructive">Sin respuesta</span>
            ) : (
              q.accepted.map((a, k) => (
                <AnswerPill key={k} tone={k === 0 ? "correct" : "alt"}>
                  {a}
                </AnswerPill>
              ))
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reading                                                                   */
/* -------------------------------------------------------------------------- */

function ReadingReview({ payload }: { payload: Record<string, unknown> }) {
  const passage = (payload.passage as string) ?? "";
  const questions =
    ((payload.questions as { prompt: string; accepted?: string[] }[]) ?? []).map(
      (q) => ({ prompt: q.prompt, accepted: q.accepted ?? [] }),
    );

  return (
    <div className="space-y-3">
      {passage && (
        <div>
          <SectionLabel>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" /> Texto
            </span>
          </SectionLabel>
          <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
            {passage}
          </div>
        </div>
      )}
      <div>
        <SectionLabel>Preguntas y respuestas</SectionLabel>
        <QuestionList questions={questions} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Listening                                                                 */
/* -------------------------------------------------------------------------- */

function ListeningReview({
  payload,
  audioUrlByMaterialId,
}: {
  payload: Record<string, unknown>;
  audioUrlByMaterialId?: Record<string, string>;
}) {
  const audioId = (payload.audioMaterialId as string) ?? "";
  const audioSrc = audioId ? audioUrlByMaterialId?.[audioId] : undefined;
  const questions =
    ((payload.questions as { prompt: string; accepted?: string[] }[]) ?? []).map(
      (q) => ({ prompt: q.prompt, accepted: q.accepted ?? [] }),
    );

  return (
    <div className="space-y-3">
      <div>
        <SectionLabel>
          <span className="inline-flex items-center gap-1">
            <Volume2 className="h-3 w-3" /> Audio
          </span>
        </SectionLabel>
        {audioId ? (
          audioSrc ? (
            <audio controls src={audioSrc} className="w-full" />
          ) : (
            <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning-foreground">
              Audio asignado pero no se pudo cargar la URL.
            </p>
          )
        ) : (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            ⚠ Sin audio asignado.
          </p>
        )}
      </div>
      <div>
        <SectionLabel>Preguntas y respuestas</SectionLabel>
        <QuestionList questions={questions} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Writing                                                                   */
/* -------------------------------------------------------------------------- */

function WritingReview({ payload }: { payload: Record<string, unknown> }) {
  const prompt = (payload.prompt as string) ?? "";
  const minW = Number(payload.minWords ?? 0);
  const maxW = Number(payload.maxWords ?? 0);
  return (
    <div className="space-y-3">
      {prompt && (
        <div>
          <SectionLabel>
            <span className="inline-flex items-center gap-1">
              <PenLine className="h-3 w-3" /> Instrucciones
            </span>
          </SectionLabel>
          <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm whitespace-pre-wrap">
            {prompt}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {minW > 0 && <Badge tone="info">Mín. {minW} palabras</Badge>}
        {maxW > 0 && <Badge tone="info">Máx. {maxW} palabras</Badge>}
        <Badge tone="warning" className="ml-auto">
          <X className="mr-1 h-3 w-3" />
          Corrección manual
        </Badge>
      </div>
    </div>
  );
}
