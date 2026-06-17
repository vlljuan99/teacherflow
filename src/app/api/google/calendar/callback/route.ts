import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/server/auth/config";
import { exchangeCodeForTokens, fetchGoogleUserInfo } from "@/server/google/oauth";
import { prisma } from "@/lib/db";
import { audit } from "@/server/audit/log";
import { Role } from "@/lib/enums";

function redirect(path: string, errorParam?: string) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const url = new URL(path, base);
  if (errorParam) url.searchParams.set("googleError", errorParam);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.TEACHER) {
    return redirect("/login");
  }
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateFromUrl = url.searchParams.get("state");
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("google_calendar_state")?.value;
  if (!code || !stateFromUrl || !stateCookie || stateFromUrl !== stateCookie) {
    return redirect("/dashboard", "invalid_state");
  }
  try {
    const tokens = await exchangeCodeForTokens(code);
    const userinfo = await fetchGoogleUserInfo(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await prisma.googleAccount.upsert({
      where: { userId: session.user.id },
      update: {
        providerAccountId: userinfo.sub ?? "",
        email: userinfo.email ?? null,
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        expiresAt,
        scope: tokens.scope ?? null,
      },
      create: {
        userId: session.user.id,
        providerAccountId: userinfo.sub ?? "",
        email: userinfo.email ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
        scope: tokens.scope ?? null,
      },
    });
    await audit({
      actorUserId: session.user.id,
      action: "google.calendar.connect",
      entity: "GoogleAccount",
    });
  } catch (err) {
    console.error("google calendar callback", err);
    return redirect("/dashboard", "token_exchange_failed");
  }
  const res = redirect("/dashboard");
  res.cookies.set("google_calendar_state", "", { maxAge: 0, path: "/" });
  return res;
}
