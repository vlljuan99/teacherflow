"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteClass } from "@/server/actions/classes";

export function DeleteClassButton({
  classId,
  label,
  variant = "destructive",
  size = "md",
}: {
  classId: string;
  label: string;
  variant?: "destructive" | "ghost";
  size?: "sm" | "md";
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`${label} esta clase?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteClass(classId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("NEXT_REDIRECT")) return; // expected
        setError(msg);
      }
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={pending}
        className={variant === "ghost" ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : undefined}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {label}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
