"use client";

import { useState, useTransition } from "react";
import { BookOpen, Loader2, ExternalLink, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareClassSession } from "@/server/actions/live-class";

function friendly(msg: string): { text: string; link?: string } {
  if (msg.includes("Google Docs API has not been used") || (msg.includes("SERVICE_DISABLED") && msg.includes("docs.googleapis.com"))) {
    return {
      text: "La Google Docs API no está habilitada en tu proyecto de Google Cloud. Actívala y reintenta.",
      link: "https://console.cloud.google.com/apis/library/docs.googleapis.com",
    };
  }
  if (msg.includes("Google not connected")) {
    return { text: "Conecta tu Google desde el dashboard." };
  }
  if (msg.includes("403") && msg.includes("insufficient")) {
    return { text: "Permisos insuficientes — desconecta Google y vuelve a conectarlo para autorizar Docs." };
  }
  return { text: msg.length > 200 ? msg.slice(0, 200) + "…" : msg };
}

export function NotebookButton({
  studentId,
  notebookUrl,
}: {
  studentId: string;
  notebookUrl: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      try {
        const res = await prepareClassSession(studentId);
        if (res.notebookUrl) {
          if (res.insertedTemplate) {
            setInfo("Plantilla del día insertada");
          }
          window.open(res.notebookUrl, "_blank", "noopener");
        } else {
          setError("Este alumno aún no tiene cuaderno");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error abriendo el cuaderno");
      }
    });
  }

  if (!notebookUrl) {
    return (
      <Button variant="outline" disabled className="h-auto py-4">
        <BookOpen className="h-5 w-5" />
        <div className="text-left">
          <div className="font-semibold">Cuaderno</div>
          <div className="text-xs opacity-70">Sin cuaderno todavía</div>
        </div>
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        onClick={onClick}
        disabled={pending}
        className="h-auto w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <BookOpen className="h-5 w-5" />
        )}
        <div className="text-left">
          <div className="font-semibold flex items-center gap-1">
            Cuaderno
            <Sparkles className="h-3 w-3" />
          </div>
          <div className="text-xs opacity-90">
            {pending ? "Preparando plantilla…" : "Abre y prepara la sesión de hoy"}
          </div>
        </div>
        <ExternalLink className="ml-auto h-4 w-4 opacity-70" />
      </Button>
      {info && <p className="text-xs text-success">✓ {info}</p>}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p>{friendly(error).text}</p>
              {friendly(error).link && (
                <a
                  href={friendly(error).link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline hover:no-underline"
                >
                  Abrir Google Cloud Console
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
