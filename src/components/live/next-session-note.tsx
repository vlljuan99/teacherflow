"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { StickyNote, Loader2, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { saveNextSessionNote } from "@/server/actions/live-class";

export function NextSessionNote({
  studentId,
  defaultValue,
}: {
  studentId: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initial = useRef(defaultValue);

  useEffect(() => {
    if (value === initial.current) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      startTransition(async () => {
        try {
          await saveNextSessionNote(studentId, value);
          initial.current = value;
          setSavedAt(Date.now());
        } catch {
          // ignore
        }
      });
    }, 1200);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [value, studentId]);

  const recentlySaved = savedAt && Date.now() - savedAt < 4000;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-accent" />
          Para la próxima clase
        </span>
        {pending ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> guardando…
          </span>
        ) : recentlySaved ? (
          <span className="flex items-center gap-1 text-xs text-success">
            <Check className="h-3 w-3" /> guardado
          </span>
        ) : null}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder='Ej.: "Repasar Past Perfect, le cuesta", "Pidió libro recomendado"…'
      />
      <p className="text-xs text-muted-foreground">
        Se guarda solo. Aparecerá la próxima vez que entres en clase con este alumno.
      </p>
    </div>
  );
}
