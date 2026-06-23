"use client";

import { ExerciseType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DndOrderWords } from "./dnd-order-words";
import { DndMatchColumns } from "./dnd-match-columns";

export interface ExerciseInput {
  id: string;
  type: string;
  prompt: string;
  points: number;
  payload: Record<string, unknown>;
}

export type AnswerValue = Record<string, unknown>;

export function ExerciseSolver({
  exercise,
  value,
  onChange,
  audioUrlByMaterialId,
  readOnly = false,
}: {
  exercise: ExerciseInput;
  value: AnswerValue | undefined;
  onChange?: (next: AnswerValue) => void;
  audioUrlByMaterialId?: Record<string, string>;
  readOnly?: boolean;
}) {
  const update = (next: AnswerValue) => {
    if (!readOnly && onChange) onChange(next);
  };

  switch (exercise.type) {
    case ExerciseType.MULTIPLE_CHOICE: {
      const options = (exercise.payload.options as string[]) ?? [];
      const multi = Boolean(exercise.payload.multi);
      const selected = ((value?.selected as number[]) ?? []) as number[];
      return (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <label
              key={i}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border bg-card p-2",
                selected.includes(i) && "border-primary",
              )}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={`mc-${exercise.id}`}
                disabled={readOnly}
                checked={selected.includes(i)}
                onChange={() => {
                  if (multi) {
                    const next = selected.includes(i)
                      ? selected.filter((x) => x !== i)
                      : [...selected, i];
                    update({ selected: next });
                  } else {
                    update({ selected: [i] });
                  }
                }}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }
    case ExerciseType.TRUE_FALSE: {
      const v = (value?.value as boolean | undefined) ?? undefined;
      return (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={v === true ? "default" : "outline"}
            disabled={readOnly}
            onClick={() => update({ value: true })}
          >
            Verdadero
          </Button>
          <Button
            type="button"
            variant={v === false ? "default" : "outline"}
            disabled={readOnly}
            onClick={() => update({ value: false })}
          >
            Falso
          </Button>
        </div>
      );
    }
    case ExerciseType.FILL_BLANKS: {
      const template = (exercise.payload.template as string) ?? "";
      const parts = template.split(/_{2,}/g);
      const blanksCount = parts.length - 1;
      const answers = ((value?.answers as string[]) ?? []) as string[];
      return (
        <p className="leading-10 text-base">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < blanksCount && (
                <span className="mx-1 inline-flex items-baseline align-baseline">
                  <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={answers[i] ?? ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      update({ answers: next });
                    }}
                    className={cn(
                      "inline-block min-w-[5rem] rounded-md border border-input bg-card px-2 py-0.5 text-sm font-medium text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring",
                      (answers[i] ?? "").length > 0 && "border-primary/60 bg-primary/5",
                    )}
                    style={{ width: `${Math.max(5, (answers[i]?.length ?? 0) + 2)}ch` }}
                  />
                </span>
              )}
            </span>
          ))}
        </p>
      );
    }
    case ExerciseType.SHORT_ANSWER: {
      return (
        <Input
          disabled={readOnly}
          value={(value?.value as string) ?? ""}
          onChange={(e) => update({ value: e.target.value })}
        />
      );
    }
    case ExerciseType.MATCH_COLUMNS: {
      const left = (exercise.payload.left as string[]) ?? [];
      const right = (exercise.payload.right as string[]) ?? [];
      const pairs = ((value?.pairs as number[][]) ?? []) as number[][];
      return (
        <DndMatchColumns
          exerciseId={exercise.id}
          left={left}
          right={right}
          pairs={pairs}
          readOnly={readOnly}
          onChange={(next) => update({ pairs: next })}
        />
      );
    }
    case ExerciseType.ORDER_WORDS: {
      const words = (exercise.payload.words as string[] | undefined) ?? [];
      const order = ((value?.order as number[]) ?? []) as number[];
      return (
        <DndOrderWords
          exerciseId={exercise.id}
          words={words}
          order={order}
          readOnly={readOnly}
          onChange={(next) => update({ order: next })}
        />
      );
    }
    case ExerciseType.READING:
    case ExerciseType.LISTENING: {
      const passage = (exercise.payload.passage as string) ?? "";
      const audioId = (exercise.payload.audioMaterialId as string) ?? "";
      const audioSrc = audioUrlByMaterialId?.[audioId];
      const questions =
        ((exercise.payload.questions as { prompt: string }[]) ?? []) as {
          prompt: string;
        }[];
      const answers = ((value?.answers as string[]) ?? []) as string[];
      return (
        <div className="space-y-3">
          {passage && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {passage}
            </div>
          )}
          {audioId && audioSrc && (
            <audio controls src={audioSrc} className="w-full" />
          )}
          {audioId && !audioSrc && (
            <p className="text-xs text-muted-foreground">[audio no disponible]</p>
          )}
          {questions.map((q, i) => (
            <div key={i} className="space-y-1.5">
              <Label>
                {i + 1}. {q.prompt}
              </Label>
              <Input
                disabled={readOnly}
                value={answers[i] ?? ""}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  update({ answers: next });
                }}
              />
            </div>
          ))}
        </div>
      );
    }
    case ExerciseType.WRITING: {
      const minW = Number(exercise.payload.minWords ?? 0);
      const maxW = Number(exercise.payload.maxWords ?? 0);
      const text = (value?.text as string) ?? "";
      const wc = text.trim().split(/\s+/).filter(Boolean).length;
      return (
        <div className="space-y-2">
          {(minW > 0 || maxW > 0) && (
            <p className="text-xs text-muted-foreground">
              {minW ? `Mín. ${minW} palabras` : ""}
              {minW && maxW ? " · " : ""}
              {maxW ? `Máx. ${maxW} palabras` : ""}
            </p>
          )}
          <Textarea
            rows={8}
            disabled={readOnly}
            value={text}
            onChange={(e) => update({ text: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">{wc} palabras</p>
          <Badge tone="info">Corrección manual</Badge>
        </div>
      );
    }
    default:
      return null;
  }
}
