import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ExternalLink, RefreshCw, FileText, BookText, GraduationCap, ClipboardCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ensureStudentNotebook, refreshStudentNotebook, triggerLazyRefresh } from "@/server/actions/notebook";
import { SearchBox } from "./search-box";

export async function NotebookSection({ studentId }: { studentId: string }) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { notebookDocId: true, notebookDocUrl: true },
  });
  if (!student) return null;

  // Fire-and-forget: if doc has changed since last parse, kick off background re-parse.
  if (student.notebookDocId) {
    triggerLazyRefresh(studentId).catch(() => {});
  }

  if (!student.notebookDocId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Cuaderno
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Aún no hay cuaderno en Google Drive para este alumno. Crea uno y la IA
            empezará a extraer vocabulario, gramática y notas automáticamente.
          </p>
          <form
            action={async () => {
              "use server";
              await ensureStudentNotebook(studentId);
            }}
          >
            <Button type="submit">
              <BookOpen className="h-4 w-4" /> Crear cuaderno en Drive
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const sessions = await prisma.sessionLog.findMany({
    where: { studentId },
    orderBy: { sessionDate: "desc" },
    take: 20,
    include: {
      vocab: { take: 8 },
      grammar: true,
      assessments: true,
    },
  });

  const pendingCount = await prisma.sessionLog.count({
    where: { studentId, status: { in: ["PENDING", "FAILED"] } },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Cuaderno
            {pendingCount > 0 && (
              <Badge tone="warning">{pendingCount} sin procesar</Badge>
            )}
          </span>
          <span className="flex items-center gap-2">
            <a
              href={student.notebookDocUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" /> Abrir en Drive
              </Button>
            </a>
            <form
              action={async () => {
                "use server";
                await refreshStudentNotebook(studentId);
              }}
            >
              <Button variant="ghost" size="sm" type="submit" title="Re-analizar ahora">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </form>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SearchBox
          studentId={studentId}
          placeholder="Buscar en el cuaderno de este alumno…"
          showStudentName={false}
        />

        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no se ha procesado ninguna sesión. Escribe la primera sesión en el
            cuaderno con una fecha en la cabecera (ej. <code>03/06/2026</code>) y
            recarga.
          </p>
        ) : (
          <ol className="space-y-4">
            {sessions.map((s) => (
              <li key={s.id} className="border-l-2 border-primary/30 pl-4">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge tone="default">{formatDate(s.sessionDate)}</Badge>
                    {s.title && (
                      <span className="text-sm font-medium">{s.title}</span>
                    )}
                  </div>
                  {s.status === "FAILED" && (
                    <Badge tone="destructive">Error: {s.errorMessage?.slice(0, 60)}</Badge>
                  )}
                  {s.status === "PENDING" && <Badge tone="warning">Procesando…</Badge>}
                </div>
                {s.summary && (
                  <p className="mt-1 text-sm text-muted-foreground">{s.summary}</p>
                )}
                {s.grammar.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-accent" />
                    {s.grammar.map((g) => (
                      <Badge key={g.id} tone="info">{g.topic}</Badge>
                    ))}
                  </div>
                )}
                {s.vocab.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-start gap-1">
                    <BookText className="mt-0.5 h-3.5 w-3.5 text-success" />
                    {s.vocab.map((v) => (
                      <span
                        key={v.id}
                        className="rounded-md bg-success/10 px-1.5 py-0.5 text-xs text-success"
                        title={v.translation ?? undefined}
                      >
                        {v.term}
                      </span>
                    ))}
                  </div>
                )}
                {s.assessments.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ClipboardCheck className="h-3.5 w-3.5 text-warning" />
                    {s.assessments.map((a) => (
                      <span key={a.id} className="text-xs text-muted-foreground">
                        {a.kind}
                        {a.score != null
                          ? ` ${a.score}${a.maxScore ? `/${a.maxScore}` : ""}`
                          : ""}
                        {a.comment ? ` — ${a.comment}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}

        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" /> La IA re-analiza el cuaderno automáticamente
          cuando detecta cambios.
        </p>
      </CardContent>
    </Card>
  );
}
