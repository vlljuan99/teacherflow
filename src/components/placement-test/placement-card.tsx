import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Trophy, Play, Pencil } from "lucide-react";

const LEVEL_GRADIENT: Record<string, string> = {
  A1: "from-rose-400 to-pink-500",
  A2: "from-orange-400 to-amber-500",
  B1: "from-amber-400 to-yellow-500",
  B2: "from-emerald-400 to-teal-500",
  C1: "from-cyan-400 to-sky-500",
  C2: "from-violet-400 to-fuchsia-500",
};

export async function PlacementCard({ studentId }: { studentId: string }) {
  const test = await prisma.placementTest.findUnique({
    where: { studentId },
  });

  if (!test) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Placement Test</h3>
            <p className="text-sm text-muted-foreground">
              Test inicial (opcional). 40 preguntas + writing + speaking. Asigna nivel CEFR.
            </p>
          </div>
          <Link href={`/students/${studentId}/placement-test`}>
            <Button>
              <Play className="h-4 w-4" /> Empezar
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (test.status === "COMPLETED") {
    const gradient = LEVEL_GRADIENT[test.cefrLevel ?? ""] ?? "from-primary to-accent";
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-warning" /> Placement Test
            <Badge tone="success">Completado</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient}`}>
              <span className="text-2xl font-bold">{test.cefrLevel}</span>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Stat label="Final" value={test.finalScore} />
              <Stat label="Grammar" value={test.grammarScore} />
              <Stat label="Reading" value={test.readingScore} />
              <Stat label="Writing" value={test.writingScore} />
              <Stat label="Speaking" value={test.speakingScore} />
            </div>
            <Link href={`/students/${studentId}/placement-test`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" /> Ver
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // In progress
  const done = [
    test.grammarScore != null,
    test.readingScore != null,
    test.writingScore != null,
    test.speakingScore != null,
  ].filter(Boolean).length;

  return (
    <Card className="border-warning/30">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-warning">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Placement Test — en curso</h3>
          <p className="text-sm text-muted-foreground">{done} de 4 partes completadas</p>
        </div>
        <Link href={`/students/${studentId}/placement-test`}>
          <Button>
            <Play className="h-4 w-4" /> Continuar
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value != null ? value.toFixed(1) : "—"}</p>
    </div>
  );
}
