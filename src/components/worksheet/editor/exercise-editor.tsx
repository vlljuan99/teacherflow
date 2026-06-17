"use client";

import { useState, useMemo } from "react";
import { ExerciseType } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TYPE_LABELS_ES: Record<ExerciseType, string> = {
  MULTIPLE_CHOICE: "Opción múltiple",
  TRUE_FALSE: "Verdadero / Falso",
  FILL_BLANKS: "Rellenar huecos",
  SHORT_ANSWER: "Respuesta corta",
  MATCH_COLUMNS: "Relacionar columnas",
  ORDER_WORDS: "Ordenar palabras",
  READING: "Reading con preguntas",
  LISTENING: "Listening con audio",
  WRITING: "Writing (manual)",
};

type Initial =
  | {
      id?: string;
      type: string;
      prompt: string;
      points: number;
      payload: Record<string, unknown>;
      solution: Record<string, unknown>;
    }
  | null;

export interface AudioMaterialOption {
  id: string;
  title: string;
}

export function ExerciseEditor({
  worksheetId,
  action,
  initial,
  cancelHref,
  audioMaterials,
}: {
  worksheetId: string;
  action: (formData: FormData) => Promise<void>;
  initial?: Initial;
  cancelHref?: string;
  audioMaterials: AudioMaterialOption[];
}) {
  const [type, setType] = useState<string>(
    initial?.type ?? ExerciseType.MULTIPLE_CHOICE,
  );
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [points, setPoints] = useState<number>(initial?.points ?? 1);

  // Type-specific state
  // MULTIPLE_CHOICE
  const initialMC = initial && initial.type === ExerciseType.MULTIPLE_CHOICE ? initial : null;
  const [options, setOptions] = useState<string[]>(
    (initialMC?.payload.options as string[]) ?? ["", ""],
  );
  const [multi, setMulti] = useState<boolean>(
    Boolean(initialMC?.payload.multi),
  );
  const [correct, setCorrect] = useState<number[]>(
    (initialMC?.solution.correct as number[]) ?? [],
  );

  // TRUE_FALSE
  const [tfValue, setTfValue] = useState<boolean>(
    initial?.type === ExerciseType.TRUE_FALSE
      ? Boolean(initial.solution.value)
      : true,
  );

  // FILL_BLANKS
  const initialFB = initial && initial.type === ExerciseType.FILL_BLANKS ? initial : null;
  const [template, setTemplate] = useState<string>(
    (initialFB?.payload.template as string) ?? "",
  );
  const [blankAnswers, setBlankAnswers] = useState<string[]>(
    ((initialFB?.solution.answers as string[][]) ?? []).map((arr) => arr.join(", ")),
  );

  // SHORT_ANSWER
  const initialSA = initial && initial.type === ExerciseType.SHORT_ANSWER ? initial : null;
  const [acceptedAnswers, setAcceptedAnswers] = useState<string>(
    ((initialSA?.solution.accepted as string[]) ?? []).join(", "),
  );

  // MATCH_COLUMNS
  const initialMM = initial && initial.type === ExerciseType.MATCH_COLUMNS ? initial : null;
  const [leftItems, setLeftItems] = useState<string[]>(
    (initialMM?.payload.left as string[]) ?? ["", ""],
  );
  const [rightItems, setRightItems] = useState<string[]>(
    (initialMM?.payload.right as string[]) ?? ["", ""],
  );
  const [pairs, setPairs] = useState<number[][]>(
    (initialMM?.solution.pairs as number[][]) ?? [],
  );

  // ORDER_WORDS
  const initialOW = initial && initial.type === ExerciseType.ORDER_WORDS ? initial : null;
  const [words, setWords] = useState<string>(
    ((initialOW?.payload.words as string[]) ?? []).join(" "),
  );

  // READING
  const initialR = initial && initial.type === ExerciseType.READING ? initial : null;
  const [passage, setPassage] = useState<string>(
    (initialR?.payload.passage as string) ?? "",
  );
  const initialRQ = (initialR?.payload.questions as { prompt: string; accepted: string[] }[]) ?? [];
  const [readingQs, setReadingQs] = useState<{ prompt: string; accepted: string }[]>(
    initialRQ.length
      ? initialRQ.map((q) => ({ prompt: q.prompt, accepted: q.accepted.join(", ") }))
      : [{ prompt: "", accepted: "" }],
  );

  // LISTENING
  const initialL = initial && initial.type === ExerciseType.LISTENING ? initial : null;
  const [audioId, setAudioId] = useState<string>(
    (initialL?.payload.audioMaterialId as string) ?? "",
  );
  const initialLQ = (initialL?.payload.questions as { prompt: string; accepted: string[] }[]) ?? [];
  const [listeningQs, setListeningQs] = useState<{ prompt: string; accepted: string }[]>(
    initialLQ.length
      ? initialLQ.map((q) => ({ prompt: q.prompt, accepted: q.accepted.join(", ") }))
      : [{ prompt: "", accepted: "" }],
  );

  // WRITING
  const initialW = initial && initial.type === ExerciseType.WRITING ? initial : null;
  const [writingPrompt, setWritingPrompt] = useState<string>(
    (initialW?.payload.prompt as string) ?? "",
  );
  const [minWords, setMinWords] = useState<number>(
    Number(initialW?.payload.minWords ?? 50),
  );
  const [maxWords, setMaxWords] = useState<number>(
    Number(initialW?.payload.maxWords ?? 200),
  );

  const { payload, solution } = useMemo(() => {
    switch (type) {
      case ExerciseType.MULTIPLE_CHOICE:
        return {
          payload: { options, multi },
          solution: { correct: multi ? correct : correct.slice(0, 1) },
        };
      case ExerciseType.TRUE_FALSE:
        return { payload: {}, solution: { value: tfValue } };
      case ExerciseType.FILL_BLANKS:
        return {
          payload: { template },
          solution: {
            answers: blankAnswers.map((s) =>
              s.split(",").map((x) => x.trim()).filter(Boolean),
            ),
            caseSensitive: false,
          },
        };
      case ExerciseType.SHORT_ANSWER:
        return {
          payload: {},
          solution: {
            accepted: acceptedAnswers
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          },
        };
      case ExerciseType.MATCH_COLUMNS:
        return {
          payload: { left: leftItems, right: rightItems },
          solution: { pairs },
        };
      case ExerciseType.ORDER_WORDS: {
        const list = words.split(/\s+/).filter(Boolean);
        return { payload: { words: list }, solution: {} };
      }
      case ExerciseType.READING:
        return {
          payload: {
            passage,
            questions: readingQs.map((q) => ({
              prompt: q.prompt,
              accepted: q.accepted
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })),
          },
          solution: {},
        };
      case ExerciseType.LISTENING:
        return {
          payload: {
            audioMaterialId: audioId,
            questions: listeningQs.map((q) => ({
              prompt: q.prompt,
              accepted: q.accepted
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })),
          },
          solution: {},
        };
      case ExerciseType.WRITING:
        return {
          payload: { prompt: writingPrompt, minWords, maxWords },
          solution: {},
        };
      default:
        return { payload: {}, solution: {} };
    }
  }, [
    type,
    options,
    multi,
    correct,
    tfValue,
    template,
    blankAnswers,
    acceptedAnswers,
    leftItems,
    rightItems,
    pairs,
    words,
    passage,
    readingQs,
    audioId,
    listeningQs,
    writingPrompt,
    minWords,
    maxWords,
  ]);

  // Auto-adjust blank answers length when template changes
  const blanksInTemplate = (template.match(/_{2,}/g) ?? []).length;
  if (blanksInTemplate !== blankAnswers.length && type === ExerciseType.FILL_BLANKS) {
    setBlankAnswers((prev) => {
      const next = [...prev];
      while (next.length < blanksInTemplate) next.push("");
      next.length = blanksInTemplate;
      return next;
    });
  }

  function toggleCorrect(i: number) {
    if (multi) {
      setCorrect((prev) =>
        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
      );
    } else {
      setCorrect([i]);
    }
  }

  function addPair() {
    setPairs((prev) => [...prev, [0, 0]]);
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="worksheetId" value={worksheetId} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <input type="hidden" name="solution" value={JSON.stringify(solution)} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">Tipo</Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {Object.values(ExerciseType).map((tp) => (
              <option key={tp} value={tp}>
                {TYPE_LABELS_ES[tp]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="points">Puntos</Label>
          <Input
            id="points"
            name="points"
            type="number"
            min={0}
            max={100}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="prompt">Enunciado</Label>
          <Textarea
            id="prompt"
            name="prompt"
            rows={3}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
      </div>

      {/* Type-specific UI */}
      <div className="rounded-md border bg-muted/30 p-4">
        {type === ExerciseType.MULTIPLE_CHOICE && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <input
                id="multi"
                type="checkbox"
                checked={multi}
                onChange={(e) => setMulti(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="multi">Permitir varias respuestas</Label>
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={correct.includes(i)}
                    onChange={() => toggleCorrect(i)}
                    className="h-4 w-4"
                    aria-label="Correcta"
                  />
                  <Input
                    value={opt}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((p, j) => (j === i ? e.target.value : p)),
                      )
                    }
                    placeholder={`Opción ${i + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setOptions((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptions((p) => [...p, ""])}
              >
                + Añadir opción
              </Button>
            </div>
          </div>
        )}

        {type === ExerciseType.TRUE_FALSE && (
          <div className="space-y-1.5">
            <Label>Respuesta correcta</Label>
            <Select
              value={tfValue ? "true" : "false"}
              onChange={(e) => setTfValue(e.target.value === "true")}
            >
              <option value="true">Verdadero</option>
              <option value="false">Falso</option>
            </Select>
          </div>
        )}

        {type === ExerciseType.FILL_BLANKS && (
          <div className="space-y-3">
            <div>
              <Label>
                Plantilla (usa <code>___</code> como hueco)
              </Label>
              <Textarea
                rows={3}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="I ___ to school every day."
              />
            </div>
            {blanksInTemplate === 0 ? (
              <p className="text-xs text-muted-foreground">
                Añade <code>___</code> en la plantilla para definir huecos.
              </p>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: blanksInTemplate }).map((_, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-[120px_1fr]">
                    <Label className="self-center">Hueco {i + 1}</Label>
                    <Input
                      value={blankAnswers[i] ?? ""}
                      onChange={(e) =>
                        setBlankAnswers((prev) =>
                          prev.map((p, j) => (j === i ? e.target.value : p)),
                        )
                      }
                      placeholder="respuesta1, sinónimo1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {type === ExerciseType.SHORT_ANSWER && (
          <div className="space-y-1.5">
            <Label>Respuestas aceptadas (separadas por coma)</Label>
            <Input
              value={acceptedAnswers}
              onChange={(e) => setAcceptedAnswers(e.target.value)}
              placeholder="London, london"
            />
          </div>
        )}

        {type === ExerciseType.MATCH_COLUMNS && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Columna izquierda</Label>
                <div className="space-y-2">
                  {leftItems.map((it, i) => (
                    <Input
                      key={i}
                      value={it}
                      onChange={(e) =>
                        setLeftItems((prev) =>
                          prev.map((p, j) => (j === i ? e.target.value : p)),
                        )
                      }
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLeftItems((p) => [...p, ""])}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div>
                <Label>Columna derecha</Label>
                <div className="space-y-2">
                  {rightItems.map((it, i) => (
                    <Input
                      key={i}
                      value={it}
                      onChange={(e) =>
                        setRightItems((prev) =>
                          prev.map((p, j) => (j === i ? e.target.value : p)),
                        )
                      }
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRightItems((p) => [...p, ""])}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Pares correctos (índice izq → índice der)</Label>
              <div className="space-y-2">
                {pairs.map(([l, r], i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={String(l)}
                      onChange={(e) =>
                        setPairs((prev) =>
                          prev.map((p, j) =>
                            j === i ? [Number(e.target.value), p[1]] : p,
                          ),
                        )
                      }
                      className="w-32"
                    >
                      {leftItems.map((it, k) => (
                        <option key={k} value={k}>
                          {k}: {it || "—"}
                        </option>
                      ))}
                    </Select>
                    <span>→</span>
                    <Select
                      value={String(r)}
                      onChange={(e) =>
                        setPairs((prev) =>
                          prev.map((p, j) =>
                            j === i ? [p[0], Number(e.target.value)] : p,
                          ),
                        )
                      }
                      className="w-32"
                    >
                      {rightItems.map((it, k) => (
                        <option key={k} value={k}>
                          {k}: {it || "—"}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPairs((p) => p.filter((_, j) => j !== i))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addPair}>
                  + Par
                </Button>
              </div>
            </div>
          </div>
        )}

        {type === ExerciseType.ORDER_WORDS && (
          <div className="space-y-1.5">
            <Label>Frase correcta (palabras separadas por espacio)</Label>
            <Input
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="I go to school"
            />
            <p className="text-xs text-muted-foreground">
              En el panel del alumno las palabras aparecerán mezcladas.
            </p>
          </div>
        )}

        {type === ExerciseType.READING && (
          <div className="space-y-3">
            <div>
              <Label>Texto del reading</Label>
              <Textarea
                rows={6}
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Preguntas</Label>
              {readingQs.map((q, i) => (
                <div key={i} className="rounded-md border bg-card p-3 space-y-2">
                  <Input
                    placeholder={`Pregunta ${i + 1}`}
                    value={q.prompt}
                    onChange={(e) =>
                      setReadingQs((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, prompt: e.target.value } : p,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Respuestas aceptadas (coma)"
                    value={q.accepted}
                    onChange={(e) =>
                      setReadingQs((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, accepted: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setReadingQs((p) => [...p, { prompt: "", accepted: "" }])
                }
              >
                + Pregunta
              </Button>
            </div>
          </div>
        )}

        {type === ExerciseType.LISTENING && (
          <div className="space-y-3">
            <div>
              <Label>Audio (material de tipo AUDIO)</Label>
              <Select value={audioId} onChange={(e) => setAudioId(e.target.value)}>
                <option value="">— Selecciona —</option>
                {audioMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </Select>
              {audioMaterials.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Sube primero un material de tipo AUDIO.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preguntas</Label>
              {listeningQs.map((q, i) => (
                <div key={i} className="rounded-md border bg-card p-3 space-y-2">
                  <Input
                    placeholder={`Pregunta ${i + 1}`}
                    value={q.prompt}
                    onChange={(e) =>
                      setListeningQs((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, prompt: e.target.value } : p,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Respuestas aceptadas (coma)"
                    value={q.accepted}
                    onChange={(e) =>
                      setListeningQs((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, accepted: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setListeningQs((p) => [...p, { prompt: "", accepted: "" }])
                }
              >
                + Pregunta
              </Button>
            </div>
          </div>
        )}

        {type === ExerciseType.WRITING && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <Label>Instrucciones</Label>
              <Textarea
                rows={3}
                value={writingPrompt}
                onChange={(e) => setWritingPrompt(e.target.value)}
              />
            </div>
            <div>
              <Label>Palabras mín.</Label>
              <Input
                type="number"
                min={0}
                value={minWords}
                onChange={(e) => setMinWords(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Palabras máx.</Label>
              <Input
                type="number"
                min={0}
                value={maxWords}
                onChange={(e) => setMaxWords(Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit">Guardar ejercicio</Button>
        {cancelHref ? (
          <a
            href={cancelHref}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm hover:bg-accent"
          >
            Cancelar
          </a>
        ) : null}
      </div>
    </form>
  );
}
