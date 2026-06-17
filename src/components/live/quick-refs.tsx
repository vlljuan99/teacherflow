"use client";

import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Ref {
  key: string;
  label: string;
  hint: string;
  buildUrl: (term: string) => string;
  baseUrl: string;
}

const REFS: Ref[] = [
  {
    key: "wr",
    label: "WordReference",
    hint: "Diccionario EN↔ES + foro",
    buildUrl: (t) => `https://www.wordreference.com/enes/${encodeURIComponent(t.trim())}`,
    baseUrl: "https://www.wordreference.com",
  },
  {
    key: "forvo",
    label: "Forvo",
    hint: "Pronunciación por nativos",
    buildUrl: (t) => `https://forvo.com/search/${encodeURIComponent(t.trim())}/`,
    baseUrl: "https://forvo.com",
  },
  {
    key: "youglish",
    label: "YouGlish",
    hint: "Clips de YouTube en contexto",
    buildUrl: (t) => `https://youglish.com/pronounce/${encodeURIComponent(t.trim().replace(/\s+/g, "_"))}/english`,
    baseUrl: "https://youglish.com",
  },
  {
    key: "deepl",
    label: "DeepL",
    hint: "Traductor de calidad",
    buildUrl: (t) => `https://www.deepl.com/translator?share=generic#en/es/${encodeURIComponent(t.trim())}`,
    baseUrl: "https://www.deepl.com/translator",
  },
  {
    key: "cambridge",
    label: "Cambridge",
    hint: "Definiciones + nivel CEFR",
    buildUrl: (t) =>
      `https://dictionary.cambridge.org/dictionary/english-spanish/${encodeURIComponent(
        t.trim().toLowerCase().replace(/\s+/g, "-"),
      )}`,
    baseUrl: "https://dictionary.cambridge.org",
  },
];

export function QuickRefs() {
  const [term, setTerm] = useState("");

  function openAll() {
    if (!term.trim()) return;
    for (const r of REFS) {
      window.open(r.buildUrl(term), "_blank", "noopener");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder='Una palabra o expresión (ej. "look up")'
            className="pl-9"
          />
        </div>
        <Button type="button" onClick={openAll} disabled={!term.trim()} variant="outline">
          Abrir en todos
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {REFS.map((r) => (
          <a
            key={r.key}
            href={term.trim() ? r.buildUrl(term) : r.baseUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-lg border bg-card p-3 transition hover:border-primary hover:shadow-sm"
          >
            <span className="flex items-center justify-between text-sm font-semibold">
              {r.label}
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </span>
            <span className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.hint}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
