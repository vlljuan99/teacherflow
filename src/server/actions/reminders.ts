"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth/session";
import { Role } from "@/lib/enums";
import { runClassReminders } from "@/server/jobs/class-reminders";
import { audit } from "@/server/audit/log";

export async function triggerClassReminders() {
  const session = await requireRole(Role.TEACHER);
  const result = await runClassReminders();
  await audit({
    actorUserId: session.user.id,
    action: "reminders.run_manual",
    entity: "Class",
    payload: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/settings/reminders");
  return result;
}
