"use client";

import { useState, useTransition } from "react";
import { Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assignMeetToStudent } from "@/server/actions/students";

export function CreateMeetButton({ studentId }: { studentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    startTransition(async () => {
      try {
        await assignMeetToStudent(studentId);
      } catch (e) {
        setError(friendly(e instanceof Error ? e.message : String(e)));
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button onClick={onClick} disabled={pending} size="sm" variant="outline">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Video className="h-4 w-4" />
        )}
        {pending ? "Creando sala…" : "Crear sala de Meet"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function friendly(msg: string): string {
  if (msg.includes("Google not connected"))
    return "Conecta tu Google desde el dashboard.";
  if (msg.includes("SERVICE_DISABLED") || msg.includes("Meet API has not been used"))
    return "Habilita la Meet API en Google Cloud Console.";
  if (msg.includes("403"))
    return "Permisos insuficientes — reconecta Google desde el dashboard.";
  return msg;
}
