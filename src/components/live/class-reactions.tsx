"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Reaction = "spanish" | "watch" | null;

type PipWindow = Window & { close: () => void };

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow(options?: { width?: number; height?: number }): Promise<PipWindow>;
    };
  }
}

export function ClassReactions() {
  const [reaction, setReaction] = useState<Reaction>(null);
  const [pipOpen, setPipOpen] = useState(false);
  const pipRef = useRef<PipWindow | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function fire(next: Exclude<Reaction, null>) {
    setReaction(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setReaction(null), 2400);
  }

  async function openFloatingRemote() {
    if (!window.documentPictureInPicture) {
      alert("El mando flotante necesita Chrome 116 o posterior.");
      return;
    }
    if (pipRef.current && !pipRef.current.closed) {
      pipRef.current.focus();
      return;
    }

    const pip = await window.documentPictureInPicture.requestWindow({ width: 460, height: 260 });
    pipRef.current = pip;
    setPipOpen(true);
    pip.document.title = "Reacciones de clase";
    pip.document.body.innerHTML = `
      <style>
        *{box-sizing:border-box} body{margin:0;background:#111827;color:white;font-family:system-ui;overflow:hidden}
        main{height:100vh;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:stretch}
        button{border:0;border-radius:18px;color:white;font-weight:900;font-size:20px;cursor:pointer;box-shadow:0 8px 24px #0006}
        #spanish{background:linear-gradient(135deg,#ef4444,#f59e0b)}
        #watch{background:linear-gradient(135deg,#7c3aed,#2563eb)}
        #stage{position:fixed;inset:0;display:none;place-items:center;text-align:center;font-weight:1000;z-index:5}
        #stage.show{display:grid;animation:pop .28s ease-out}
        #stage.spanish{background:linear-gradient(135deg,#dc2626,#facc15);font-size:42px;text-shadow:0 4px 0 #991b1b}
        #stage.watch{background:radial-gradient(circle,#fef3c7,#f59e0b);color:#451a03;font-size:86px}
        #close{position:fixed;right:6px;top:4px;width:28px;height:28px;background:#0008;border-radius:50%;font-size:16px;z-index:9}
        @keyframes pop{0%{transform:scale(.25) rotate(-8deg);opacity:0}70%{transform:scale(1.08) rotate(2deg)}100%{transform:scale(1);opacity:1}}
      </style>
      <button id="close" aria-label="Cerrar">×</button>
      <main><button id="spanish">🇪🇸<br>¡¡ ESPAÑOLADA !!</button><button id="watch">👀<br>¡¡ OJO !!</button></main>
      <div id="stage"></div>`;

    const stage = pip.document.getElementById("stage")!;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const show = (kind: "spanish" | "watch") => {
      if (hideTimer) clearTimeout(hideTimer);
      stage.className = `show ${kind}`;
      stage.innerHTML = kind === "spanish" ? "🇪🇸<br>¡¡ ESPAÑOLADA !!<br>🇪🇸" : "👀<br><span style='font-size:34px'>¡¡ OJO !!</span>";
      hideTimer = setTimeout(() => { stage.className = ""; stage.innerHTML = ""; }, 2200);
      fire(kind);
    };
    pip.document.getElementById("spanish")!.onclick = () => show("spanish");
    pip.document.getElementById("watch")!.onclick = () => show("watch");
    pip.document.getElementById("close")!.onclick = () => pip.close();
    pip.addEventListener("pagehide", () => { pipRef.current = null; setPipOpen(false); });
  }

  return (
    <>
      <div className="rounded-xl border border-dashed border-accent/50 bg-gradient-to-r from-red-50 via-amber-50 to-violet-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Reacciones de clase</h2>
            <p className="text-xs text-muted-foreground">
              Abre el mando flotante antes de ir al Doc. Comparte la pantalla completa para que el alumno lo vea.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={openFloatingRemote}>
            <PictureInPicture2 className="h-4 w-4" />
            {pipOpen ? "Mando flotante abierto" : "Abrir mando flotante"}
          </Button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => fire("spanish")} className="rounded-xl bg-gradient-to-r from-red-600 to-amber-400 px-5 py-4 text-xl font-black text-white shadow-lg transition hover:scale-[1.02]">
            🇪🇸 ¡¡ ESPAÑOLADA !!
          </button>
          <button type="button" onClick={() => fire("watch")} className="rounded-xl bg-gradient-to-r from-violet-700 to-blue-500 px-5 py-4 text-xl font-black text-white shadow-lg transition hover:scale-[1.02]">
            👀 ¡¡ OJO !!
          </button>
        </div>
      </div>

      {reaction && (
        <div className={`pointer-events-none fixed inset-0 z-[100] grid place-items-center overflow-hidden ${reaction === "spanish" ? "bg-gradient-to-br from-red-600/95 via-yellow-400/95 to-red-600/95" : "bg-amber-300/95"}`}>
          <div className="animate-[bounce_700ms_ease-in-out_infinite] text-center font-black drop-shadow-2xl">
            {reaction === "spanish" ? (
              <><div className="text-8xl">🇪🇸</div><div className="mt-3 text-5xl text-white">¡¡ ESPAÑOLADA !!</div></>
            ) : (
              <><Eye className="mx-auto h-36 w-36 text-amber-950" strokeWidth={3} /><div className="mt-2 text-6xl text-amber-950">¡¡ OJO !!</div></>
            )}
          </div>
        </div>
      )}
    </>
  );
}
