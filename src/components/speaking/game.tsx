"use client";

import { useMemo, useState } from "react";
import {
  Check,
  X,
  SkipForward,
  RotateCcw,
  Trophy,
  Sparkles,
  Zap,
  ArrowLeftRight,
  Skull,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SpeakingQ {
  id: string;
  prompt: string;
  level: string | null;
  track: string | null;
  category: string | null;
  points: number;
  twist: string | null;
}

export interface GameLabels {
  team1: string;
  team2: string;
  currentTurn: string;
  correct: string;
  wrong: string;
  skip: string;
  next: string;
  reset: string;
  startOver: string;
  points: string;
  twistOptions: { DOUBLE: string; STEAL: string; SWAP: string; LOSE: string };
  winner: string;
  tie: string;
  finalScore: string;
  questionsLeft: string;
}

const TWIST_VISUAL: Record<
  string,
  { icon: LucideIcon; gradient: string; ring: string }
> = {
  DOUBLE: { icon: Zap, gradient: "from-amber-400 to-orange-500", ring: "ring-amber-300" },
  STEAL: { icon: Sparkles, gradient: "from-fuchsia-500 to-pink-500", ring: "ring-fuchsia-300" },
  SWAP: { icon: ArrowLeftRight, gradient: "from-sky-500 to-indigo-500", ring: "ring-sky-300" },
  LOSE: { icon: Skull, gradient: "from-slate-600 to-slate-900", ring: "ring-slate-400" },
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SpeakingGame({
  questions,
  labels,
}: {
  questions: SpeakingQ[];
  labels: GameLabels;
}) {
  const [seed, setSeed] = useState(0);
  const deck = useMemo(() => shuffle(questions), [questions, seed]);

  const [used, setUsed] = useState<Set<string>>(() => new Set());
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [current, setCurrent] = useState<SpeakingQ | null>(null);

  function pickNext() {
    const remaining = deck.filter((q) => !used.has(q.id));
    if (remaining.length === 0) {
      setCurrent(null);
      return;
    }
    setCurrent(remaining[Math.floor(Math.random() * remaining.length)]);
  }

  function applyResult(correct: boolean) {
    if (!current) return;
    const team = turn;
    const other: 0 | 1 = team === 0 ? 1 : 0;
    const next: [number, number] = [scores[0], scores[1]];

    if (correct) {
      switch (current.twist) {
        case "DOUBLE":
          next[team] += current.points * 2;
          break;
        case "STEAL":
          next[team] += current.points;
          next[other] = Math.max(0, next[other] - current.points);
          break;
        case "SWAP": {
          const tmp = next[0];
          next[0] = next[1];
          next[1] = tmp;
          next[team] += current.points;
          break;
        }
        case "LOSE":
          // even when right, LOSE removes points from the team that picked it
          next[team] = Math.max(0, next[team] - current.points);
          break;
        default:
          next[team] += current.points;
      }
    } else {
      // wrong answer: STEAL/LOSE penalize the picking team; others just pass turn
      if (current.twist === "LOSE") {
        next[team] = Math.max(0, next[team] - current.points);
      }
    }

    setScores(next);
    setUsed((u) => new Set(u).add(current.id));
    setTurn(other);
    setCurrent(null);
  }

  function skip() {
    if (!current) return;
    setUsed((u) => new Set(u).add(current.id));
    setTurn((t) => (t === 0 ? 1 : 0));
    setCurrent(null);
  }

  function resetAll() {
    setUsed(new Set());
    setScores([0, 0]);
    setTurn(0);
    setCurrent(null);
    setSeed((s) => s + 1);
  }

  const remaining = deck.filter((q) => !used.has(q.id));
  const finished = remaining.length === 0 && !current;
  const winner =
    finished && scores[0] !== scores[1]
      ? scores[0] > scores[1]
        ? labels.team1
        : labels.team2
      : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((idx) => {
          const active = turn === idx && !finished;
          const isTeam1 = idx === 0;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 text-white shadow-sm transition sm:p-5 ${
                isTeam1
                  ? "from-violet-500 to-fuchsia-500"
                  : "from-sky-500 to-cyan-500"
              } ${active ? "ring-4 ring-offset-2 ring-white/60 scale-[1.02]" : "opacity-80"}`}
            >
              <div className="text-xs font-medium uppercase tracking-wider opacity-90">
                {isTeam1 ? labels.team1 : labels.team2}
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
                {scores[idx]}
              </div>
              {active && (
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-90">
                  {labels.currentTurn}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Question card */}
      {current ? (
        <QuestionCard
          q={current}
          labels={labels}
          onCorrect={() => applyResult(true)}
          onWrong={() => applyResult(false)}
          onSkip={skip}
        />
      ) : finished ? (
        <FinishedCard
          labels={labels}
          scores={scores}
          winner={winner}
          onReset={resetAll}
        />
      ) : (
        <button
          onClick={pickNext}
          className="group flex w-full items-center justify-between gap-3 rounded-2xl border bg-gradient-to-r from-primary to-accent p-6 text-left text-white shadow-md transition active:scale-[0.99] sm:hover:shadow-lg"
        >
          <div>
            <div className="text-xs font-medium uppercase tracking-wider opacity-90">
              {labels.questionsLeft}: {remaining.length}
            </div>
            <div className="mt-1 text-xl font-semibold">{labels.next}</div>
          </div>
          <ChevronRight className="h-6 w-6 shrink-0 transition group-active:translate-x-0.5" />
        </button>
      )}

      {/* Footer reset */}
      <div className="flex justify-center pt-2">
        <button
          onClick={resetAll}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {labels.reset}
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  labels,
  onCorrect,
  onWrong,
  onSkip,
}: {
  q: SpeakingQ;
  labels: GameLabels;
  onCorrect: () => void;
  onWrong: () => void;
  onSkip: () => void;
}) {
  const visual = q.twist ? TWIST_VISUAL[q.twist] : null;
  const TwistIcon = visual?.icon;

  return (
    <div className="space-y-3">
      <div
        className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-md sm:p-6 ${
          visual ? `ring-2 ${visual.ring}` : ""
        }`}
      >
        {visual && TwistIcon && (
          <div
            className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-2.5 py-1 text-xs font-semibold text-white shadow ${visual.gradient}`}
          >
            <TwistIcon className="h-3.5 w-3.5" />
            {labels.twistOptions[q.twist as keyof typeof labels.twistOptions]}
          </div>
        )}
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {q.level && (
            <span className="rounded-full bg-muted px-2 py-0.5">{q.level}</span>
          )}
          {q.category && (
            <span className="rounded-full bg-muted px-2 py-0.5">{q.category}</span>
          )}
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
            +{q.points} {labels.points}
          </span>
        </div>
        <div className="text-xl font-semibold leading-snug sm:text-2xl">
          {q.prompt}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onWrong}
          className="flex flex-col items-center gap-1 rounded-xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200 transition active:scale-[0.97] sm:hover:bg-red-100"
        >
          <X className="h-5 w-5" />
          {labels.wrong}
        </button>
        <button
          onClick={onSkip}
          className="flex flex-col items-center gap-1 rounded-xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition active:scale-[0.97] sm:hover:bg-slate-200"
        >
          <SkipForward className="h-5 w-5" />
          {labels.skip}
        </button>
        <button
          onClick={onCorrect}
          className="flex flex-col items-center gap-1 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition active:scale-[0.97] sm:hover:bg-emerald-100"
        >
          <Check className="h-5 w-5" />
          {labels.correct}
        </button>
      </div>
    </div>
  );
}

function FinishedCard({
  labels,
  scores,
  winner,
  onReset,
}: {
  labels: GameLabels;
  scores: [number, number];
  winner: string | null;
  onReset: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 text-center text-white shadow-lg">
      <Trophy className="mx-auto h-12 w-12 drop-shadow" />
      <div className="mt-2 text-xs font-medium uppercase tracking-wider opacity-90">
        {labels.finalScore}
      </div>
      <div className="mt-1 text-3xl font-bold sm:text-4xl">
        {scores[0]} – {scores[1]}
      </div>
      <div className="mt-3 text-lg font-semibold">
        {winner ? `${winner} 🏆 ${labels.winner}` : labels.tie}
      </div>
      <button
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-orange-600 shadow transition active:scale-[0.97] hover:bg-white"
      >
        <RotateCcw className="h-4 w-4" />
        {labels.startOver}
      </button>
    </div>
  );
}
