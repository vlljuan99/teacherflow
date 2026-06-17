"use client";

import { useState, useTransition } from "react";
import { Plus, X, BookText, Loader2, Check, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { appendVocabToNotebook } from "@/server/actions/live-class";

export function VocabCatcher({
  studentId,
  hasNotebook,
}: {
  studentId: string;
  hasNotebook: boolean;
}) {
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function add() {
    const t = draft.trim();
    if (!t) return;
    if (!items.includes(t)) setItems((curr) => [...curr, t]);
    setDraft("");
  }

  function remove(t: string) {
    setItems((curr) => curr.filter((x) => x !== t));
  }

  function save() {
    if (items.length === 0) return;
    setError(null);
    setJustSaved(false);
    startTransition(async () => {
      try {
        await appendVocabToNotebook(studentId, items);
        setItems([]);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error guardando vocab");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookText className="h-4 w-4 text-success" />
        Vocabulario de la sesión
        {items.length > 0 && (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
            {items.length}
          </span>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex gap-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='Palabra o expresión + Enter'
        />
        <Button type="submit" variant="outline" size="sm" disabled={!draft.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Escribe palabras que vayan saliendo durante la clase. Al final pulsa
          "Guardar al cuaderno" y se añaden al Google Doc del alumno.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((t) => (
            <li
              key={t}
              className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs text-success"
            >
              {t}
              <button
                type="button"
                onClick={() => remove(t)}
                className="hover:text-destructive"
                title="Quitar"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <Button
          type="button"
          onClick={save}
          disabled={pending || !hasNotebook}
          size="sm"
          className="w-full"
          title={hasNotebook ? "Añadir al cuaderno" : "El alumno aún no tiene cuaderno"}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : justSaved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending
            ? "Guardando…"
            : justSaved
              ? "Guardado al cuaderno"
              : "Guardar al cuaderno"}
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!hasNotebook && (
        <p className="text-xs text-warning">
          Este alumno aún no tiene cuaderno. Créalo desde su ficha.
        </p>
      )}
    </div>
  );
}
