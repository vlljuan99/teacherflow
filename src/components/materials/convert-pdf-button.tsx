"use client";

import { useState, useTransition } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertPdfToWorksheetSafe } from "@/server/actions/pdf-convert";

export function ConvertPdfButton({ materialId }: { materialId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await convertPdfToWorksheetSafe(materialId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Wand2 className="h-3.5 w-3.5" />
        )}
        {isPending ? "Procesando…" : "Crear ficha IA"}
      </Button>
      {error && (
        <p className="max-w-[200px] text-right text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
