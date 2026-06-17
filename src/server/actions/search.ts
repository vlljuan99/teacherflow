"use server";

import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { semanticSearch, type SearchHit } from "@/server/notebook/search";

export async function searchNotebooks(
  query: string,
  studentId?: string,
): Promise<SearchHit[]> {
  await requireRole(Role.TEACHER);
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  return semanticSearch(trimmed, { studentId, limit: 10 });
}
