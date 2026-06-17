"use client";

import { useMemo } from "react";
import { ExerciseType } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExerciseInput {
  id: string;
  type: string;
  prompt: string;
  points: number;
  payload: Record<string, unknown>;
}

export type AnswerValue = Record<string, unknown>;

function shuffle<T>(arr: T[], seed: string): { value: T; originalIndex: number }[] {
  // Deterministic shuffle so the order is stable per exercise id
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const indexed = arr.map((v, i) => ({ value: v, originalIndex: i }));
  for (let i = indexed.length - 1; i > 0; i--) {
    h = (h * 9301 + 49297) % 233280;
    const j = h % (i + 1);
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  return indexed;
}

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

  // Compute deterministic shuffle once so it's stable across renders.
  const wordsForShuffle = (exercise.payload.words as string[] | undefined) ?? [];
  const shuffledWords = useMemo(
    () => shuffle(wordsForShuffle, exercise.id),
    [exercise.id, wordsForShuffle],
  );

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
        <p className="leading-9">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < blanksCount && (
                <input
                  type="text"
                  disabled={readOnly}
                  value={answers[i] ?? ""}
                  onChange={(e) => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    update({ answers: next });
                  }}
                  className="mx-1 inline-block w-32 rounded border-b border-input bg-transparent px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
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
      const setRightFor = (l: number, r: number) => {
        const others = pairs.filter((p) => p[0] !== l);
        update({ pairs: [...others, [l, r]] });
      };
      return (
        <div className="space-y-2">
          {left.map((l, i) => {
            const current = pairs.find((p) => p[0] === i)?.[1];
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1/3 truncate">{l}</span>
                <span>→</span>
                <Select
                  disabled={readOnly}
                  value={current != null ? String(current) : ""}
                  onChange={(e) => setRightFor(i, Number(e.target.value))}
                  className="flex-1"
                >
                  <option value="">—</option>
                  {right.map((r, k) => (
                    <option key={k} value={k}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
            );
          })}
        </div>
      );
    }
    case ExerciseType.ORDER_WORDS: {
      const words = wordsForShuffle;
      const order = ((value?.order as number[]) ?? []) as number[];
      const remaining = shuffledWords.filter((w) => !order.includes(w.originalIndex));
      return (
        <div className="space-y-3">
          <div className="min-h-[40px] rounded-md border border-dashed bg-muted/30 p-2 text-sm">
            {order.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {order.map((origIdx, posIdx) => (
                  <Button
                    key={posIdx}
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={readOnly}
                    onClick={() =>
                      update({ order: order.filter((_, i) => i !== posIdx) })
                    }
                  >
                    {words[origIdx]}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {remaining.map((w) => (
              <Button
                key={w.originalIndex}
                type="button"
                size="sm"
                variant="outline"
                disabled={readOnly}
                onClick={() => update({ order: [...order, w.originalIndex] })}
              >
                {w.value}
              </Button>
            ))}
          </div>
        </div>
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
