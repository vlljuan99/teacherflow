import { prisma } from "@/lib/db";
import { refreshAccessToken } from "./oauth";

const MEET_SPACES = "https://meet.googleapis.com/v2/spaces";

async function getValidAccessToken(userId: string): Promise<string> {
  const acc = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!acc) throw new Error("Google not connected");
  if (!acc.refreshToken) throw new Error("No refresh token stored");
  const stillValid =
    acc.accessToken && acc.expiresAt && acc.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return acc.accessToken!;
  const refreshed = await refreshAccessToken(acc.refreshToken);
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await prisma.googleAccount.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      expiresAt,
      ...(refreshed.refresh_token ? { refreshToken: refreshed.refresh_token } : {}),
    },
  });
  return refreshed.access_token;
}

export async function createMeetSpace(teacherUserId: string): Promise<string> {
  const accessToken = await getValidAccessToken(teacherUserId);
  const res = await fetch(MEET_SPACES, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meet space create failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { meetingUri?: string };
  if (!data.meetingUri) {
    throw new Error("Meet response missing meetingUri");
  }
  return data.meetingUri;
}
