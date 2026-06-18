"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { runClassroomImport, type ImportResult } from "@/server/actions/classroom-import";

interface Props {
  courseId: string;
  courseName: string;
  topics: Record<string, string>;
  materials: Array<{
    id: string;
    title: string;
    topicId?: string;
    topicName?: string;
    driveFiles: Array<{ id: string; title?: string }>;
  }>;
  totalDriveFiles: number;
}

export function ClassroomImportClient(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byTopic = new Map<string, typeof props.materials>();
  for (const m of props.materials) {
    const key = m.topicName ?? "Sin tema";
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key)!.push(m);
  }

  function handleImport() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await runClassroomImport(props.courseId);
        setResult(res);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Importar: ${props.courseName}`}
        description={`${props.materials.length} materiales · ${props.totalDriveFiles} archivos de Drive`}
        actions={
          <div className="flex gap-2">
            <Link href="/materials/import">
              <Button variant="outline">Volver</Button>
            </Link>
            <Button onClick={handleImport} disabled={isPending}>
              <Cloud className="h-4 w-4" />
              {isPending ? "Importando…" : `Importar ${props.totalDriveFiles} a Azure`}
            </Button>
          </div>
        }
      />

      {error && (
        <Card>
          <CardContent className="flex items-start gap-2 pt-6 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="space-y-2 pt-6 text-sm">
            <div className="flex items-center gap-2 font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Importación completada
            </div>
            <ul className="space-y-1 text-muted-foreground">
              <li>{result.importedFiles} archivos subidos a Azure</li>
              <li>{result.importedMaterials} materiales creados</li>
              {result.skipped > 0 && <li>{result.skipped} omitidos (ya existían)</li>}
              {result.errors.length > 0 && (
                <li className="text-destructive">
                  {result.errors.length} errores:{" "}
                  {result.errors
                    .slice(0, 3)
                    .map((e) => e.error)
                    .join(", ")}
                </li>
              )}
            </ul>
            <Link href="/materials" className="text-primary hover:underline">
              Ver biblioteca →
            </Link>
          </CardContent>
        </Card>
      )}

      {Array.from(byTopic.entries()).map(([topic, mats]) => (
        <Card key={topic}>
          <CardContent className="pt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {topic}{" "}
              <Badge tone="muted">{mats.reduce((s, m) => s + m.driveFiles.length, 0)}</Badge>
            </h2>
            <ul className="space-y-2 text-sm">
              {mats.map((m) => (
                <li key={m.id} className="border-l-2 border-muted pl-3">
                  <div className="font-medium">{m.title}</div>
                  {m.driveFiles.length > 0 ? (
                    <ul className="mt-1 text-xs text-muted-foreground">
                      {m.driveFiles.map((d) => (
                        <li key={d.id}>· {d.title ?? d.id}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">
                      sin adjuntos de Drive
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
