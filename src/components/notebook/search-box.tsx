"use client";

import { useState, useTransition } from "react";
import { Search, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchNotebooks } from "@/server/actions/search";
import { formatDate } from "@/lib/utils";

type Hit = {
  sessionLogId: string;
  studentId: string;
  studentName: string;
  sessionDate: Date | string;
  title: string | null;
  snippet: string;
  score: number;
  notebookDocUrl: string | null;
};

export function SearchBox({
  studentId,
  placeholder = "Buscar en los cuadernos…",
  showStudentName = true,
}: {
  studentId?: string;
  placeholder?: string;
  showStudentName?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    startTransition(async () => {
      const res = await searchNotebooks(query, studentId);
      setHits(res as Hit[]);
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
        {pending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </form>
      {hits && hits.length === 0 && !pending && (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      )}
      {hits && hits.length > 0 && (
        <ul className="space-y-2">
          {hits.map((h) => (
            <li key={h.sessionLogId}>
              <Card className="p-3 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {showStudentName && (
                        <Link
                          href={`/students/${h.studentId}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {h.studentName}
                        </Link>
                      )}
                      <Badge tone="muted">{formatDate(h.sessionDate)}</Badge>
                      {h.title && (
                        <span className="text-xs text-muted-foreground truncate">
                          {h.title}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                        {(h.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/80 line-clamp-3 whitespace-pre-wrap">
                      {h.snippet}
                    </p>
                  </div>
                  {h.notebookDocUrl && (
                    <a
                      href={h.notebookDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-primary hover:underline"
                      title="Abrir cuaderno"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
