"use client";

import { useState, useTransition } from "react";
import { Repeat, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteClassSeries } from "@/server/actions/classes";

export function SeriesBanner({
  seriesId,
  seriesNote,
}: {
  seriesId: string;
  seriesNote: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<"future" | "all" | null>(null);

  function runDelete(onlyFuture: boolean) {
    startTransition(async () => {
      try {
        const n = await deleteClassSeries(seriesId, { onlyFuture });
        router.push(`/classes?deleted=${n}`);
      } catch (e) {
        console.error(e);
        alert("No se pudo eliminar la serie.");
      }
    });
  }

  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex items-center gap-2 text-sm">
          <Repeat className="h-4 w-4 text-accent" />
          <span>
            <span className="font-semibold">Parte de una serie.</span>{" "}
            <span className="text-muted-foreground">
              {seriesNote ?? "Clase recurrente"}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {confirming == null ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirming("future")}
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" /> Eliminar futuras
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirming("all")}
                disabled={pending}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Eliminar serie completa
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive font-semibold">
                ¿Confirmar {confirming === "all" ? "eliminar TODAS" : "eliminar futuras"}?
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => runDelete(confirming === "future")}
                disabled={pending}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Sí, eliminar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(null)}
                disabled={pending}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
