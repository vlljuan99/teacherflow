"use client";

import { useState, useTransition } from "react";
import { Video, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateMeetForNewStudent, assignMeetToStudent } from "@/server/actions/students";

export function MeetLinkField({
  name = "meetLink",
  defaultValue,
  studentId,
}: {
  name?: string;
  defaultValue?: string | null;
  studentId?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    setJustCreated(false);
    startTransition(async () => {
      try {
        const url = studentId
          ? await assignMeetToStudent(studentId)
          : await generateMeetForNewStudent();
        setValue(url);
        setJustCreated(true);
      } catch (e) {
        setError(
          e instanceof Error
            ? friendlyError(e.message)
            : "No se pudo crear la sala de Meet",
        );
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          id={name}
          name={name}
          type="url"
          placeholder="https://meet.google.com/abc-defg-hij"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setJustCreated(false);
          }}
        />
        <Button type="button" variant="outline" onClick={onClick} disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : justCreated ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Video className="h-4 w-4" />
          )}
          {pending ? "Creando…" : justCreated ? "Creada" : "Generar sala"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {justCreated && !error && (
        <p className="text-xs text-success">
          Sala creada. {studentId ? "Ya está guardada en el alumno." : "Recuerda guardar el formulario."}
        </p>
      )}
    </div>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("Google not connected")) {
    return "Conecta tu cuenta de Google desde el dashboard primero.";
  }
  if (msg.includes("403")) {
    if (msg.includes("Meet API has not been used") || msg.includes("SERVICE_DISABLED")) {
      return "Habilita la Meet API en Google Cloud Console y reintenta.";
    }
    return "Permisos insuficientes. Desconecta Google en el dashboard y reconéctalo para autorizar Meet.";
  }
  return msg;
}
