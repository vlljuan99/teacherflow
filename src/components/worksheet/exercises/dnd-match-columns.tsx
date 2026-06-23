"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { GripVertical, X } from "lucide-react";

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

/* ----- draggable right-column chip ----- */
function DraggableChip({
  id,
  label,
  disabled,
}: {
  id: string;
  label: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "inline-flex cursor-grab select-none items-center gap-1 rounded-md border border-input bg-card px-2.5 py-1.5 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium">{label}</span>
    </div>
  );
}

/* ----- droppable slot for each left item ----- */
function DropSlot({
  id,
  current,
  rightLabel,
  onClear,
  disabled,
}: {
  id: string;
  current: number | undefined;
  rightLabel: string | undefined;
  onClear: () => void;
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[40px] flex-1 items-center justify-between rounded-md border-2 border-dashed px-2.5 py-1.5 text-sm transition-colors",
        isOver
          ? "border-primary bg-primary/10"
          : current != null
            ? "border-primary/40 bg-primary/5"
            : "border-muted-foreground/30 bg-muted/20",
      )}
    >
      {current != null && rightLabel ? (
        <>
          <span className="font-medium text-primary">{rightLabel}</span>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="rounded p-0.5 text-muted-foreground hover:bg-black/5"
            aria-label="Quitar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">arrastra aquí</span>
      )}
    </div>
  );
}

export function DndMatchColumns({
  exerciseId,
  left,
  right,
  pairs,
  onChange,
  readOnly = false,
}: {
  exerciseId: string;
  left: string[];
  right: string[];
  pairs: number[][];
  onChange: (next: number[][]) => void;
  readOnly?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const shuffledRight = useMemo(
    () => shuffleDeterministic(right, exerciseId + ":r"),
    [right, exerciseId],
  );

  const pairByLeft = new Map<number, number>(
    pairs.map(([l, r]) => [l, r] as [number, number]),
  );
  const usedRight = new Set(pairs.map(([, r]) => r));

  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const rightIdx = Number(String(active.id).replace("r-", ""));
    const leftIdx = Number(String(over.id).replace("l-", ""));
    if (Number.isNaN(rightIdx) || Number.isNaN(leftIdx)) return;
    // Remove any existing assignment for this left and any existing usage of this right.
    const next = pairs.filter((p) => p[0] !== leftIdx && p[1] !== rightIdx);
    next.push([leftIdx, rightIdx]);
    onChange(next);
  }

  function clearLeft(leftIdx: number) {
    if (readOnly) return;
    onChange(pairs.filter((p) => p[0] !== leftIdx));
  }

  const activeLabel = activeId
    ? right[Number(activeId.replace("r-", ""))]
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Left column: each row is a drop slot */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Columna A
          </div>
          {left.map((l, i) => {
            const r = pairByLeft.get(i);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1/2 truncate text-sm font-medium">
                  {l}
                </span>
                <DropSlot
                  id={`l-${i}`}
                  current={r}
                  rightLabel={r != null ? right[r] : undefined}
                  onClear={() => clearLeft(i)}
                  disabled={readOnly}
                />
              </div>
            );
          })}
        </div>

        {/* Right column: draggable chips */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Columna B
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/20 p-2">
            {shuffledRight.map((s) =>
              usedRight.has(s.originalIndex) ? null : (
                <DraggableChip
                  key={s.originalIndex}
                  id={`r-${s.originalIndex}`}
                  label={s.value}
                  disabled={readOnly}
                />
              ),
            )}
            {shuffledRight.every((s) => usedRight.has(s.originalIndex)) && (
              <span className="text-xs text-muted-foreground">
                — todas asignadas —
              </span>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeLabel ? (
          <div className="inline-flex items-center gap-1 rounded-md border border-primary bg-card px-2.5 py-1.5 text-sm shadow-lg">
            <GripVertical className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{activeLabel}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
