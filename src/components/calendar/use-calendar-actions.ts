"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteClass, moveClass } from "@/server/actions/classes";

export function useCalendarActions() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId((current) => (current === id ? null : current));
      }, 15000);
      return;
    }
    setConfirmDeleteId(null);
    startTransition(async () => {
      try {
        await deleteClass(id);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("NEXT_REDIRECT")) {
          router.refresh();
          return;
        }
        console.error(e);
        alert("No se pudo eliminar la clase.");
      }
    });
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
  }

  function handleMove(classId: string, newDateIso: string, keepTime = true) {
    startTransition(async () => {
      try {
        await moveClass(classId, newDateIso, keepTime);
        router.refresh();
      } catch (e) {
        console.error(e);
        alert("No se pudo mover la clase.");
      }
    });
  }

  return {
    pending,
    confirmDeleteId,
    handleDelete,
    cancelDelete,
    handleMove,
    refresh: () => startTransition(() => router.refresh()),
  };
}
