"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Save,
  Mic,
  PenLine,
  BookOpenCheck,
  Languages,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  GRAMMAR_QUESTIONS,
  READING_QUESTIONS,
  READING_TEXT,
  WRITING_PROMPT,
  SPEAKING_PROMPTS,
  type Question,
} from "@/server/placement-test/content";
import {
  saveGrammar,
  saveReading,
  saveWriting,
  saveSpeaking,
  finalizePlacementTest,
  resetPlacementTest,
} from "@/server/actions/placement-test";

type Tab = "grammar" | "reading" | "writing" | "speaking" | "result";

export interface PlacementTestInitial {
  grammarAnswers: (string | null)[];
  grammarScore: number | null;
  readingAnswers: (string | null)[];
  readingScore: number | null;
  writingText: string;
  writingScore: number | null;
  writingComment: string;
  speakingNotes: string;
  speakingScore: number | null;
  speakingComment: string;
  finalScore: number | null;
  cefrLevel: string | null;
  status: string;
}

export function TestRunner({
  studentId,
  initial,
}: {
  studentId: string;
  initial: PlacementTestInitial;
}) {
  const [tab, setTab] = useState<Tab>(
    initial.status === "COMPLETED" ? "result" : initial.grammarScore == null ? "grammar" : "reading",
  );

  return (
    <div className="space-y-4">
      <Tabs current={tab} onChange={setTab} initial={initial} />

      {tab === "grammar" && (
        <GrammarTab
          studentId={studentId}
          initial={initial.grammarAnswers}
          initialScore={initial.grammarScore}
          onSaved={() => setTab("reading")}
        />
      )}
      {tab === "reading" && (
        <ReadingTab
          studentId={studentId}
          initial={initial.readingAnswers}
          initialScore={initial.readingScore}
          onSaved={() => setTab("writing")}
        />
      )}
      {tab === "writing" && (
        <WritingTab
          studentId={studentId}
          initial={{
            text: initial.writingText,
            score: initial.writingScore,
            comment: initial.writingComment,
          }}
          onSaved={() => setTab("speaking")}
        />
      )}
      {tab === "speaking" && (
        <SpeakingTab
          studentId={studentId}
          initial={{
            notes: initial.speakingNotes,
            score: initial.speakingScore,
            comment: initial.speakingComment,
          }}
          onSaved={() => setTab("result")}
        />
      )}
      {tab === "result" && (
        <ResultTab
          studentId={studentId}
          initial={initial}
          onEdit={(t) => setTab(t)}
        />
      )}
    </div>
  );
}

function Tabs({
  current,
  onChange,
  initial,
}: {
  current: Tab;
  onChange: (t: Tab) => void;
  initial: PlacementTestInitial;
}) {
  const items: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }>; done: boolean }[] = [
    { key: "grammar", label: "1. Grammar", icon: Languages, done: initial.grammarScore != null },
    { key: "reading", label: "2. Reading", icon: BookOpenCheck, done: initial.readingScore != null },
    { key: "writing", label: "3. Writing", icon: PenLine, done: initial.writingScore != null },
    { key: "speaking", label: "4. Speaking", icon: Mic, done: initial.speakingScore != null },
    { key: "result", label: "Resultado", icon: Trophy, done: initial.status === "COMPLETED" },
  ];
  return (
    <div className="inline-flex w-full flex-wrap rounded-md border bg-card p-0.5">
      {items.map((it) => {
        const Icon = it.icon;
        const active = current === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={cn(
              "flex-1 min-w-[110px] flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {it.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Grammar ----------

function GrammarTab({
  studentId,
  initial,
  initialScore,
  onSaved,
}: {
  studentId: string;
  initial: (string | null)[];
  initialScore: number | null;
  onSaved: () => void;
}) {
  const [answers, setAnswers] = useState<(string | null)[]>(
    GRAMMAR_QUESTIONS.map((_, i) => initial[i] ?? null),
  );
  const [pending, startTransition] = useTransition();
  const completed = answers.every((a) => a != null);

  function save() {
    startTransition(async () => {
      await saveGrammar(studentId, answers);
      onSaved();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Part 1 — Grammar & Vocabulary</span>
          {initialScore != null && (
            <Badge tone="success">{initialScore.toFixed(1)} / 10</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          10 preguntas · auto-corrección · 1 punto cada una
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {GRAMMAR_QUESTIONS.map((q, idx) => (
          <QuestionBlock
            key={q.id}
            index={idx + 1}
            question={q}
            value={answers[idx]}
            onChange={(v) => {
              const next = [...answers];
              next[idx] = v;
              setAnswers(next);
            }}
          />
        ))}
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Respondidas: {answers.filter((a) => a != null).length} / 10
          </p>
          <Button onClick={save} disabled={pending || !completed}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar y siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Reading ----------

function ReadingTab({
  studentId,
  initial,
  initialScore,
  onSaved,
}: {
  studentId: string;
  initial: (string | null)[];
  initialScore: number | null;
  onSaved: () => void;
}) {
  const [answers, setAnswers] = useState<(string | null)[]>(
    READING_QUESTIONS.map((_, i) => initial[i] ?? null),
  );
  const [pending, startTransition] = useTransition();
  const completed = answers.every((a) => a != null);

  function save() {
    startTransition(async () => {
      await saveReading(studentId, answers);
      onSaved();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Part 2 — Reading</span>
          {initialScore != null && (
            <Badge tone="success">{initialScore.toFixed(1)} / 10</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Lee el texto · 5 multiple choice + 5 True/False
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {READING_TEXT.split("\n").map((line, i) => {
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={i} className="font-bold">
                  {line.slice(2, -2)}
                </p>
              );
            }
            return <p key={i}>{line}</p>;
          })}
        </div>
        {READING_QUESTIONS.map((q, idx) => (
          <QuestionBlock
            key={q.id}
            index={idx + 1}
            question={q}
            value={answers[idx]}
            onChange={(v) => {
              const next = [...answers];
              next[idx] = v;
              setAnswers(next);
            }}
          />
        ))}
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Respondidas: {answers.filter((a) => a != null).length} / 10
          </p>
          <Button onClick={save} disabled={pending || !completed}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar y siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Writing ----------

function WritingTab({
  studentId,
  initial,
  onSaved,
}: {
  studentId: string;
  initial: { text: string; score: number | null; comment: string };
  onSaved: () => void;
}) {
  const [text, setText] = useState(initial.text);
  const [score, setScore] = useState<string>(initial.score?.toString() ?? "");
  const [comment, setComment] = useState(initial.comment);
  const [pending, startTransition] = useTransition();

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  function save() {
    startTransition(async () => {
      await saveWriting(studentId, {
        text,
        score: score === "" ? null : Number(score),
        comment,
      });
      onSaved();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Part 3 — Writing</CardTitle>
        <p className="text-xs text-muted-foreground">
          Lo escribe el alumno · la profesora puntúa
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-accent/5 p-4 text-sm">
          <p className="font-semibold">{WRITING_PROMPT.title}</p>
          <p className="mt-2">{WRITING_PROMPT.intro}</p>
          <p className="mt-2 font-medium">Include:</p>
          <ul className="ml-4 list-disc">
            {WRITING_PROMPT.include.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Estructura: {WRITING_PROMPT.structure.join(" → ")}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Texto del alumno</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Pega o transcribe aquí el escrito del alumno…"
          />
          <p className="mt-1 text-xs text-muted-foreground">{wordCount} palabras</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nota (0–10)</label>
            <Input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Comentario (opcional)</label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Buena estructura, fallos en preposiciones…"
            />
          </div>
        </div>
        <div className="flex items-center justify-end border-t pt-4">
          <Button onClick={save} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar y siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Speaking ----------

function SpeakingTab({
  studentId,
  initial,
  onSaved,
}: {
  studentId: string;
  initial: { notes: string; score: number | null; comment: string };
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState(initial.notes);
  const [score, setScore] = useState<string>(initial.score?.toString() ?? "");
  const [comment, setComment] = useState(initial.comment);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await saveSpeaking(studentId, {
        notes,
        score: score === "" ? null : Number(score),
        comment,
      });
      onSaved();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Part 4 — Speaking</CardTitle>
        <p className="text-xs text-muted-foreground">
          La profesora conversa con el alumno y lo puntúa
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-accent/5 p-4 text-sm space-y-3">
          <div>
            <p className="font-semibold">Long-turn — elige una</p>
            <ul className="ml-4 list-disc">
              {SPEAKING_PROMPTS.longTurn.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Pronunciación a comprobar</p>
            <p className="text-xs">{SPEAKING_PROMPTS.pronunciationFocus.join(", ")}</p>
          </div>
          <div>
            <p className="font-semibold">Vocabulario de referencia (si surge)</p>
            <p className="text-xs">{SPEAKING_PROMPTS.vocabularyFocus.join(" · ")}</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notas de la profesora</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Vocabulario que ha usado, errores de pronunciación, fluidez…"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nota (0–10)</label>
            <Input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Comentario (opcional)</label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Pronunciación clara, dudas con tiempos verbales…"
            />
          </div>
        </div>
        <div className="flex items-center justify-end border-t pt-4">
          <Button onClick={save} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar y ver resultado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Result ----------

const LEVEL_COLOR: Record<string, string> = {
  A1: "from-rose-400 to-pink-500",
  A2: "from-orange-400 to-amber-500",
  B1: "from-amber-400 to-yellow-500",
  B2: "from-emerald-400 to-teal-500",
  C1: "from-cyan-400 to-sky-500",
  C2: "from-violet-400 to-fuchsia-500",
};

function ResultTab({
  studentId,
  initial,
  onEdit,
}: {
  studentId: string;
  initial: PlacementTestInitial;
  onEdit: (t: Tab) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allDone =
    initial.grammarScore != null &&
    initial.readingScore != null &&
    initial.writingScore != null &&
    initial.speakingScore != null;

  function finalize() {
    setError(null);
    startTransition(async () => {
      try {
        await finalizePlacementTest(studentId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function reset() {
    if (!confirm("¿Resetear el placement test? Se borrarán todas las respuestas y notas.")) return;
    startTransition(async () => {
      await resetPlacementTest(studentId);
    });
  }

  if (initial.status === "COMPLETED" && initial.cefrLevel) {
    const gradient = LEVEL_COLOR[initial.cefrLevel] ?? "from-primary to-accent";
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado del Placement Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className={cn("rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg", gradient)}>
            <p className="text-xs uppercase tracking-wider opacity-90">Nivel estimado</p>
            <p className="mt-1 text-5xl font-bold">{initial.cefrLevel}</p>
            <p className="mt-2 text-2xl font-semibold">
              {initial.finalScore?.toFixed(1)} / 10
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <ScoreCell label="Grammar" score={initial.grammarScore} />
            <ScoreCell label="Reading" score={initial.readingScore} />
            <ScoreCell label="Writing" score={initial.writingScore} />
            <ScoreCell label="Speaking" score={initial.speakingScore} />
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" size="sm" onClick={reset} disabled={pending}>
              <RotateCcw className="h-4 w-4" /> Resetear
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumen y cierre</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ScoreCell label="Grammar" score={initial.grammarScore} onEdit={() => onEdit("grammar")} />
          <ScoreCell label="Reading" score={initial.readingScore} onEdit={() => onEdit("reading")} />
          <ScoreCell label="Writing" score={initial.writingScore} onEdit={() => onEdit("writing")} />
          <ScoreCell label="Speaking" score={initial.speakingScore} onEdit={() => onEdit("speaking")} />
        </div>
        {!allDone && (
          <p className="text-sm text-warning">
            Faltan partes por puntuar. Completa todas para cerrar el test.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button onClick={finalize} disabled={pending || !allDone}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="h-4 w-4" />
            )}
            Cerrar test y asignar nivel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreCell({
  label,
  score,
  onEdit,
}: {
  label: string;
  score: number | null;
  onEdit?: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      {score == null ? (
        <p className="mt-1 text-lg font-semibold text-muted-foreground">—</p>
      ) : (
        <p className="mt-1 text-lg font-semibold">{score.toFixed(1)}</p>
      )}
      {onEdit && (
        <button onClick={onEdit} className="mt-1 text-[10px] text-primary hover:underline">
          Editar
        </button>
      )}
    </div>
  );
}

// ---------- Reusable question block ----------

function QuestionBlock({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: Question;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <p className="text-sm font-medium">
        <span className="mr-2 text-muted-foreground">{index}.</span>
        {question.prompt}
      </p>
      {question.hint && (
        <p className="mt-0.5 text-[11px] text-muted-foreground italic">{question.hint}</p>
      )}
      <ul className="mt-2 grid gap-1.5">
        {question.choices.map((c) => {
          const active = value === c.key;
          return (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onChange(c.key)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                {active ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className="font-mono text-xs uppercase opacity-60">{c.key})</span> {c.text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
