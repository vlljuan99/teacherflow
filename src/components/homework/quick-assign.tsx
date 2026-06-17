"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { quickAssignHomework } from "@/server/actions/assignments";

export function QuickAssign({
  studentId,
  groupId,
  worksheets,
}: {
  studentId?: string;
  groupId?: string;
  worksheets: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [worksheetId, setWorksheetId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justAssigned, setJustAssigned] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!worksheetId) {
      setError("Elige una ficha");
      return;
    }
    setError(null);
    setJustAssigned(false);
    startTransition(async () => {
      try {
        await quickAssignHomework({
          studentId,
          groupId,
          worksheetId,
          dueAt: dueAt || null,
        });
        setWorksheetId("");
        setDueAt("");
        setJustAssigned(true);
        setTimeout(() => setJustAssigned(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Asignar deberes
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-card/50 p-3 space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">Ficha</label>
          <Select value={worksheetId} onChange={(e) => setWorksheetId(e.target.value)}>
            <option value="">Elige una ficha…</option>
            {worksheets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Fecha límite</label>
          <Input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={submit} disabled={pending} size="sm">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : justAssigned ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {pending ? "Asignando…" : justAssigned ? "Asignado" : "Asignar"}
        </Button>
        <Button onClick={() => setOpen(false)} size="sm" variant="ghost">
          Cancelar
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
