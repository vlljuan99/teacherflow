import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@/server/auth/config";
import { buildCalendarAuthUrl } from "@/server/google/oauth";
import { Role } from "@/lib/enums";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.TEACHER) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  }
  const state = randomBytes(16).toString("hex");
  const url = buildCalendarAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set("google_calendar_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
