import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export interface AuditEvent {
  actorUserId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
}

export async function audit(event: AuditEvent) {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    userAgent = h.get("user-agent");
  } catch {
    // headers() unavailable outside request context
  }
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: event.actorUserId ?? null,
        action: event.action,
        entity: event.entity,
        entityId: event.entityId ?? null,
        payload: event.payload != null ? JSON.stringify(event.payload) : null,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("audit failed", err);
  }
}
