import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runClassReminders } from "@/server/jobs/class-reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(req: Request): boolean {
  const e = env();
  if (!e.CRON_SECRET) return false;
  const auth = req.headers.get("authorization") ?? "";
  if (auth === `Bearer ${e.CRON_SECRET}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === e.CRON_SECRET) return true;
  return false;
}

async function handle(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runClassReminders();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
