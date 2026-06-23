"use client";

import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Plus, Minus } from "lucide-react";

function shuffleDeterministic<T>(
  arr: T[],
  seed: string,
): { value: T; originalIndex: number }[] {
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

type Token = { id: string; label: string; originalIndex: number };

function SortableToken({
  token,
  disabled,
  variant,
  onAction,
  actionIcon,
  actionLabel,
}: {
  token: Token;
  disabled: boolean;
  variant: "answer" | "bank";
  onAction: () => void;
  actionIcon: React.ReactNode;
  actionLabel: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: token.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "inline-flex select-none items-center gap-1 rounded-md px-2.5 py-1.5 text-sm shadow-sm",
        variant === "answer"
          ? "bg-primary text-primary-foreground"
          : "border border-input bg-card",
        isDragging && "opacity-50",
        disabled && "opacity-70",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        className={cn(
          "cursor-grab touch-none active:cursor-grabbing",
          variant === "answer" ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
        aria-label="Arrastrar"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="font-medium">{token.label}</span>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={cn(
          "ml-1 rounded p-0.5 hover:bg-black/10",
          variant === "answer" ? "text-primary-foreground/90" : "text-muted-foreground",
        )}
        aria-label={actionLabel}
      >
        {actionIcon}
      </button>
    </div>
  );
}

export function DndOrderWords({
  exerciseId,
  words,
  order,
  onChange,
  readOnly = false,
}: {
  exerciseId: string;
  words: string[];
  order: number[];
  onChange: (next: number[]) => void;
  readOnly?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const shuffled = useMemo(
    () => shuffleDeterministic(words, exerciseId),
    [words, exerciseId],
  );

  const answerTokens: Token[] = order.map((origIdx) => ({
    id: `a-${origIdx}`,
    label: words[origIdx] ?? "",
    originalIndex: origIdx,
  }));
  const bankTokens: Token[] = shuffled
    .filter((s) => !order.includes(s.originalIndex))
    .map((s) => ({
      id: `b-${s.originalIndex}`,
      label: s.value,
      originalIndex: s.originalIndex,
    }));

  function handleAnswerDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = answerTokens.findIndex((t) => t.id === active.id);
    const newIdx = answerTokens.findIndex((t) => t.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(answerTokens, oldIdx, newIdx);
    onChange(reordered.map((t) => t.originalIndex));
  }

  function moveToAnswer(origIdx: number) {
    if (readOnly) return;
    onChange([...order, origIdx]);
  }
  function moveToBank(origIdx: number) {
    if (readOnly) return;
    onChange(order.filter((i) => i !== origIdx));
  }

  return (
    <div className="space-y-3">
      {/* Answer area (drop zone, sortable) */}
      <div className="rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-3">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary/80">
          Tu respuesta
        </div>
        {answerTokens.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Arrastra o pulsa + para añadir palabras aquí.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleAnswerDragEnd}
          >
            <SortableContext
              items={answerTokens.map((t) => t.id)}
              strategy={rectSortingStrategy}
            >
              <div className="flex flex-wrap gap-1.5">
                {answerTokens.map((t) => (
                  <SortableToken
                    key={t.id}
                    token={t}
                    disabled={readOnly}
                    variant="answer"
                    onAction={() => moveToBank(t.originalIndex)}
                    actionIcon={<Minus className="h-3 w-3" />}
                    actionLabel="Quitar"
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Word bank */}
      <div className="rounded-md border bg-muted/30 p-3">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Palabras disponibles
        </div>
        {bankTokens.length === 0 ? (
          <p className="text-xs text-muted-foreground">— vacío —</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {bankTokens.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={readOnly}
                onClick={() => moveToAnswer(t.originalIndex)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border border-input bg-card px-2.5 py-1.5 text-sm shadow-sm hover:bg-accent/10 disabled:opacity-60",
                )}
              >
                <span className="font-medium">{t.label}</span>
                <Plus className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
